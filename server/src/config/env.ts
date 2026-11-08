import { existsSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

/**
 * Environment, validated once at start-up. The server refuses to boot in
 * production without the secrets it needs: a missing secret is a crash at
 * deploy time, never a silently open endpoint.
 */

const bool = z
  .enum(['true', 'false', '1', '0', ''])
  .optional()
  .transform((value) => value === 'true' || value === '1');

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .pipe(z.url({ protocol: /^https?$/ }).optional());

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  PUBLIC_ORIGIN: z.url({ protocol: /^https?$/ }).default('http://localhost:5173'),
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),

  CAKTO_WEBHOOK_SECRET: z.string().default(''),
  CAKTO_REQUIRE_SIGNATURE: bool,
  CAKTO_PRODUCT_IDS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),

  ACCESS_TOKEN_SECRET: z.string().default(''),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(300).max(86_400).default(3600),
  APP_URL: optionalUrl,

  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: bool,
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  MAIL_FROM: z.string().default('Prato Rápido <nao-responda@localhost>'),

  DATA_DIR: z.string().default('./data'),
  STATIC_DIR: z.string().default('../client/dist'),
});

export type Env = z.infer<typeof schema> & { isProduction: boolean };

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const details = z.prettifyError(parsed.error);
    throw new Error(`Invalid environment:\n${details}`);
  }
  const env = { ...parsed.data, isProduction: parsed.data.NODE_ENV === 'production' };

  if (env.isProduction) {
    const problems: string[] = [];
    if (env.CAKTO_WEBHOOK_SECRET.length < 16) problems.push('CAKTO_WEBHOOK_SECRET (at least 16 characters)');
    if (env.ACCESS_TOKEN_SECRET.length < 32) problems.push('ACCESS_TOKEN_SECRET (at least 32 characters)');
    if (!env.PUBLIC_ORIGIN.startsWith('https://')) problems.push('PUBLIC_ORIGIN (must be https)');
    if (env.APP_URL && !env.APP_URL.startsWith('https://')) problems.push('APP_URL (must be https)');
    if (problems.length > 0) throw new Error(`Missing or weak production settings: ${problems.join(', ')}`);
  } else if (env.ACCESS_TOKEN_SECRET.length < 32) {
    // Local development only: a fixed, obviously-not-secret key.
    env.ACCESS_TOKEN_SECRET = 'development-only-access-token-secret-do-not-use';
  }

  return env;
}

/** Loads server/.env when present (Node's built-in parser, no dependency). */
export function loadDotEnv(file = path.resolve(process.cwd(), '.env')): void {
  if (existsSync(file)) process.loadEnvFile(file);
}
