// instrumentation.ts
// [PLAN-SSR-DIAG-INSTR] Temporary diagnostic instrumentation.
// This file is removed in the same commit that ships the actual fix.
//
// Purpose: catch module-load errors (ERR_REQUIRE_ESM) that fire BEFORE
// route handlers run, by installing global Node process handlers at
// Next.js server startup.
//
// Next.js auto-loads this file at runtime startup. Reference:
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation

export async function register() {
  // Only register on the Node.js server runtime, not on edge.
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  console.log("[PLAN-SSR-DIAG-INSTR] register() called, installing global handlers");

  // 1. Catch any unhandled exception that bubbles up from require() or async work.
  process.on("uncaughtException", (err: Error & { code?: string }) => {
    console.error("[PLAN-SSR-DIAG-INSTR] uncaughtException", {
      name: err?.name,
      message: err?.message,
      code: err?.code,
      stack: err?.stack,
    });
    // Do NOT re-throw and do NOT exit. Vercel's runtime will handle the request failure.
  });

  // 2. Catch any unhandled promise rejection.
  process.on("unhandledRejection", (reason: unknown) => {
    const r = reason as Error & { code?: string };
    console.error("[PLAN-SSR-DIAG-INSTR] unhandledRejection", {
      name: r?.name,
      message: r?.message,
      code: r?.code,
      stack: r?.stack,
    });
  });

  console.log("[PLAN-SSR-DIAG-INSTR] global handlers installed");
}

export async function onRequestError(
  err: unknown,
  request: { path: string; method: string; headers: Record<string, string | string[]> },
  context: { routerKind: string; routePath: string; routeType: string },
) {
  // Next.js 16 calls this hook for any error that bubbles up from a route render.
  // This is the most reliable place to catch /plan's module-load failure.
  const e = err as Error & { code?: string; cause?: unknown };
  console.error("[PLAN-SSR-DIAG-INSTR] onRequestError", {
    requestPath: request?.path,
    requestMethod: request?.method,
    routePath: context?.routePath,
    routeType: context?.routeType,
    errorName: e?.name,
    errorMessage: e?.message,
    errorCode: e?.code,
    errorStack: e?.stack,
    errorCause: e?.cause ? String(e.cause) : undefined,
  });
}
