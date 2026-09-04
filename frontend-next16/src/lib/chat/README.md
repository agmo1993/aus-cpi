# Chat data tools + Answer schema

POST `/api/chat` and the `/chat` page use Cloudflare Workers AI for tool choice + prose. Numbers come from `runChatTool` (Zod-validated handlers over the existing CPI query layer)—not from the model inventing figures.

## Cloudflare Workers AI setup

1. Create an API token with **Workers AI Edit** (or **Workers AI Write**).
2. Copy your **Account ID** from the Cloudflare dashboard.
3. Put credentials in `.env.local`:

```env
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
CHAT_MODEL=@cf/zai-org/glm-4.7-flash
```

`CHAT_MODEL` is optional (defaults to `@cf/zai-org/glm-4.7-flash`, available on the Workers Free plan). Hermes 2 Pro is deprecated (410).

4. Restart `next start` after setting env (env is read at process start).
5. Free tier is ~10k Neurons/day; quota / auth errors surface in the UI (no silent empty reply).

## Contract

1. The model picks tools from `CHAT_TOOLS` and emits JSON args.
2. The server calls `runChatTool(name, args)`, which validates with Zod and runs the handler.
3. Each handler returns `{ data, ui, asOfMonth?, error? }`:
   - **`data`** — raw payload for the model (numbers, ids, rows).
   - **`ui`** — suggested `AnswerPart[]` so the client can render without re-deriving.
4. A chat response is an **Answer**:

```ts
{ prose?: string; parts: AnswerPart[]; asOfMonth?: string /* mm-yyyy */ }
```

`AnswerPart` is a discriminated union (`stat_cards`, `timeseries`, `top_movers`, `correlation_matrix`, `series_list`, `text`). Map part types to UI via `CHAT_TOOLS[*].uiComponents` (StatCard, MultiLineChart, TopMovers, CorrelationMatrix, …).

## Tools

| Tool | Query / math source |
|------|---------------------|
| `search_cpi_series` | `searchSeries` |
| `resolve_series` | `getSeriesById` / `getSeriesByItem` |
| `get_cpi_timeseries` | `getMonthlyTimeSeries` / `getQuarterlyTimeSeries` + JS month slice |
| `get_headline_cpi` | `getMainCPISeries` + `getLatestReleaseMonth` + home-page MoM/QoQ/YoY |
| `get_top_movers` | `getTopMonthlyIncreases` / `getTopYearlyIncreases` |
| `get_annual_change` | `getAnnualChangeByItem` |
| `get_series_stats` | `getSeriesStatistics` / `getPercentageChanges` |
| `correlate_series` | `getMultipleTimeSeries` + same Pearson path as `/api/correlate` (`MIN_OVERLAP` 12) |

Basket inputs (`getBasketInputs`) are **not** exposed.

## Server-only

`handlers.ts` and `runChatTool` use `pg`. Import `@/lib/chat` only from server code. Shared types/schemas live in `schema.ts` if a client needs them without handlers.

## Examples

See `examples.ts` for question → tool call → expected part-type fixtures.
