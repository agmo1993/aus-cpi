# ABS ↔ BLS CPI category crosswalk (v1)

## Why curated mapping + `match_quality`

ABS and BLS CPI item trees are **not** the same taxonomy. ABS monthly groups (~27 headline) and quarterly COICOP-ish items (~144) do not line up 1:1 with BLS CU item codes (~400, display levels 0–5). Silent fuzzy matching would produce misleading AU↔US comparisons.

Every row in `abs_bls_category_crosswalk.csv` is **human-reviewed** and carries:

| `match_quality` | Meaning |
|-----------------|---------|
| `exact` | Same concept / near-identical scope |
| `close` | Same major category; basket composition or exclusions differ |
| `broader` | BLS item covers more than the ABS item |
| `narrower` | BLS item covers less than the ABS item |
| `unmapped` | No acceptable BLS analogue — do not invent one |

UI and loaders must surface `match_quality` (and `notes`) whenever a comparison chart is shown. Never auto-guess new mappings without review.

## US city average vs ABS capitals

v1 BLS series IDs use the convention:

```text
CU + U (NSA) + R (monthly) + 0000 (U.S. city average) + {item_code}
→ e.g. CUUR0000SA0  (All items), CUUR0000SAF1 (Food), CUUR0000SA0E (Energy)
```

- **BLS area `0000`**: U.S. city average (population-weighted urban).
- **ABS**: All-groups and categories published for Australia and eight capital cities.

These geographies are **not** equivalent. Treat v1 as national US vs national AU (or AU capitals) with an explicit caveat — metro-level BLS areas are out of scope until a later release.

## Shelter / housing methodology gaps

This is the largest conceptual gap:

| ABS | BLS |
|-----|-----|
| **New dwelling purchase by owner-occupiers** (price of new dwellings in the CPI) | **Owners' equivalent rent (OER)** — `SEHC` / shelter weight dominated by imputed rent |
| **Rents** (actual rents) | **Rent of primary residence** (`SEHA`) — closer match |
| **Housing** group includes new dwellings + rents + utilities + … | **Housing (`SAH`)** = shelter (rent + OER + lodging) + fuels/utilities + furnishings/ops |

Do **not** map ABS “New dwelling purchase by owner-occupiers” to OER as `exact` or `close` — leave **`unmapped`** (or document as methodological alternative only). Housing-level charts should show `broader`/`narrower` notes.

## v1 scope

- **In:** National US CPI-U NSA (`CUUR0000*`) for curated major ABS groups; crosswalk table + extract smoke CSV.
- **Out:** Seasonally adjusted series, metro areas, full quarterly ABS leaf mapping, auto-ingestion to production DB.
- **Source of truth for item codes:** BLS flat file `cu.item` (https://download.bls.gov/pub/time.series/cu/cu.item); prefer display_level 0–2 for majors (exceptions: high-value leaves like Electricity `SEHF01`, Motor fuel `SETB`).

## Files

- `abs_bls_category_crosswalk.csv` — curated seed mappings
- `../deploy/10-add-bls-cpi.sql` — `bls_series`, `bls_cpi_index`, `cpi_category_crosswalk`
- `../extract_bls_cpi.py` — allowlist extract → `bls_cpi_observations.csv`

## Extract notes (ops)

Official path is BLS Public API or `download.bls.gov` flat files (`cu.data.*`). If the unregistered API daily quota is exhausted and flat-file hosts return 403 to automated clients, `extract_bls_cpi.py` falls back to **FRED CSV mirrors** for the smoke trio only:

| BLS item | Series ID | FRED id |
|----------|-----------|---------|
| SA0 All items | CUUR0000SA0 | CPIAUCNS |
| SAF1 Food | CUUR0000SAF1 | CPIUFDSL |
| SA0E Energy | CUUR0000SA0E | CPIENGNS |

Register a BLS API key (or vendor flat files manually) before expanding beyond smoke / production load.
