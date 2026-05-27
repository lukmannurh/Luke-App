/**
 * Structured JSON logger for server-side use.
 * Outputs JSON lines for easy parsing in Vercel/cloud log aggregators.
 *
 * Key events to log: drawing execution, cron job results, rate limit hits, auth failures.
 */

export const logger = {
  info(msg: string, meta?: Record<string, unknown>): void {
    console.log(
      JSON.stringify({ level: "info", msg, ...meta, ts: new Date().toISOString() })
    );
  },

  warn(msg: string, meta?: Record<string, unknown>): void {
    console.warn(
      JSON.stringify({ level: "warn", msg, ...meta, ts: new Date().toISOString() })
    );
  },

  error(msg: string, err?: unknown, meta?: Record<string, unknown>): void {
    const errInfo =
      err instanceof Error
        ? { error: err.message, stack: err.stack }
        : err !== undefined
        ? { error: String(err) }
        : {};
    console.error(
      JSON.stringify({
        level: "error",
        msg,
        ...errInfo,
        ...meta,
        ts: new Date().toISOString(),
      })
    );
  },
};
