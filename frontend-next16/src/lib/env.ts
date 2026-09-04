import { z } from "zod";

const DEFAULT_CHAT_MODEL = "@cf/zai-org/glm-4.7-flash";

const envSchema = z.object({
  DB_HOST: z.string().min(1, "DB_HOST is required"),
  DB_USER: z.string().min(1, "DB_USER is required"),
  DB_PASS: z.string().min(1, "DB_PASS is required"),
  DB_PORT: z.string().default("5432"),
  DB_NAME: z.string().default("auscpidb2"),
  // Neon requires SSL; a local postgres generally has it disabled.
  DB_SSL: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  NEXT_PUBLIC_API_URL: z.string().optional(),
  // Cloudflare Workers AI — optional at build; required at runtime for /api/chat
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CHAT_MODEL: z.string().default(DEFAULT_CHAT_MODEL),
});

// Parse environment variables
// During build time, use default values to avoid errors
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.DB_HOST;

export const env = isBuildTime
  ? {
      DB_HOST: 'localhost',
      DB_USER: 'postgres',
      DB_PASS: 'password',
      DB_PORT: '5432',
      DB_NAME: 'auscpidb2',
      DB_SSL: false,
      NEXT_PUBLIC_API_URL: undefined,
      CLOUDFLARE_ACCOUNT_ID: undefined as string | undefined,
      CLOUDFLARE_API_TOKEN: undefined as string | undefined,
      CHAT_MODEL: DEFAULT_CHAT_MODEL,
    }
  : envSchema.parse({
      DB_HOST: process.env.DB_HOST,
      DB_USER: process.env.DB_USER,
      DB_PASS: process.env.DB_PASS,
      DB_PORT: process.env.DB_PORT,
      DB_NAME: process.env.DB_NAME,
      DB_SSL: process.env.DB_SSL,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
      CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
      CHAT_MODEL: process.env.CHAT_MODEL,
    });

/** True when Workers AI credentials are present for chat. */
export function hasCloudflareChatEnv(): boolean {
  return Boolean(env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN);
}

export { DEFAULT_CHAT_MODEL };
