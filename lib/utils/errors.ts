/**
 * Error handling utilities for the Community Giveaway Platform.
 *
 * All API routes return errors in the shape:
 * { error: { code: string, message: string } }
 */

// ──────────────────────────────────────────────
// AppError class
// ──────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

// ──────────────────────────────────────────────
// Factory helpers — use these everywhere instead of `new AppError`
// ──────────────────────────────────────────────

export function unauthorizedError(
  message = "You must be signed in to do that."
): AppError {
  return new AppError("UNAUTHORIZED", message, 401);
}

export function forbiddenError(
  message = "You don't have permission to do that."
): AppError {
  return new AppError("FORBIDDEN", message, 403);
}

export function validationError(
  message = "The request data is invalid.",
  fields?: Record<string, string>
): AppError & { fields?: Record<string, string> } {
  const err = new AppError("VALIDATION_ERROR", message, 400) as AppError & {
    fields?: Record<string, string>;
  };
  err.fields = fields;
  return err;
}

export function notFoundError(
  resource = "Resource"
): AppError {
  return new AppError("NOT_FOUND", `${resource} not found.`, 404);
}

export function conflictError(message: string): AppError {
  return new AppError("CONFLICT", message, 409);
}

export function rateLimitError(
  message = "You're doing that too fast. Please wait a moment."
): AppError {
  return new AppError("RATE_LIMIT_EXCEEDED", message, 429);
}

export function internalError(
  message = "Something went wrong on our end. Please try again."
): AppError {
  return new AppError("INTERNAL_ERROR", message, 500);
}

// ──────────────────────────────────────────────
// Response formatter — call this in API route catch blocks
// ──────────────────────────────────────────────

interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

export function formatErrorResponse(err: unknown): {
  body: ErrorResponseBody;
  status: number;
} {
  if (err instanceof AppError) {
    const body: ErrorResponseBody = {
      error: { code: err.code, message: err.message },
    };
    // Attach field-level validation errors if present
    const withFields = err as AppError & { fields?: Record<string, string> };
    if (withFields.fields) {
      body.error.fields = withFields.fields;
    }
    return { body, status: err.statusCode };
  }

  // Unexpected error — log it but return a generic message to the client
  console.error("[formatErrorResponse] Unexpected error:", err);
  return {
    body: {
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong on our end. Please try again.",
      },
    },
    status: 500,
  };
}

// ──────────────────────────────────────────────
// Guard — narrows unknown catch values
// ──────────────────────────────────────────────

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

/**
 * Detects Supabase/PostgreSQL unique constraint violations.
 * The Postgres error code for unique violation is "23505".
 */
export function isUniqueConstraintError(err: unknown): boolean {
  if (err && typeof err === "object" && "code" in err) {
    return (err as { code: string }).code === "23505";
  }
  return false;
}
