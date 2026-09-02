import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * A deliberate, user-facing error. Anything else thrown inside a route
 * handler is treated as unexpected: it gets logged server-side with full
 * detail but the client only ever sees a generic message. This keeps stack
 * traces, DB errors, and provider error payloads from ever leaking to the
 * browser.
 */
export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found.") {
    super(message, 404);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You don't have access to this resource.") {
    super(message, 403);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Please sign in to continue.") {
    super(message, 401);
  }
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Some fields are invalid.", details: error.flatten() },
      { status: 400 }
    );
  }
  // Unknown/unexpected error: log full detail server-side, never expose it.
  console.error("[api]", error);
  return NextResponse.json(
    { error: "Something went wrong on our end. Please try again." },
    { status: 500 }
  );
}

/** Wraps a route handler body so any thrown error becomes a safe JSON response. */
export function withErrorHandling<Args extends unknown[]>(
  fn: (...args: Args) => Promise<NextResponse>
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await fn(...args);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
