/**
 * Minimal structured logger: one JSON line per event, no PII by convention
 * (e-mails are masked or hashed before they reach a log line).
 */
type Level = 'debug' | 'info' | 'warn' | 'error';

const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = order[(process.env.LOG_LEVEL as Level | undefined) ?? (process.env.NODE_ENV === 'test' ? 'error' : 'info')] ?? 20;

function write(level: Level, message: string, fields?: Record<string, unknown>) {
  if (order[level] < threshold) return;
  const line = JSON.stringify({ time: new Date().toISOString(), level, message, ...fields });
  if (level === 'error' || level === 'warn') process.stderr.write(`${line}\n`);
  else process.stdout.write(`${line}\n`);
}

export const logger = {
  debug: (message: string, fields?: Record<string, unknown>) => write('debug', message, fields),
  info: (message: string, fields?: Record<string, unknown>) => write('info', message, fields),
  warn: (message: string, fields?: Record<string, unknown>) => write('warn', message, fields),
  error: (message: string, fields?: Record<string, unknown>) => write('error', message, fields),
};

export type Logger = typeof logger;
