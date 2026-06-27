import { Effect, Random } from "effect";

import {
  AuthenticationReason,
  ContentPolicyReason,
  InvalidRequestReason,
  LLMError,
  ProviderInternalReason,
  QuotaExceededReason,
  RateLimitReason,
  TransportReason,
  UnknownProviderReason,
} from "./error";

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 10_000;

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 503 || status === 504 || status === 529;
}

interface ProviderApiResponse {
  status: number;
  body: string;
  headers: Record<string, string>;
}

function classifyError(status: number, body: string, method: string): LLMError {
  const lowerBody = body.toLowerCase();

  if (/content[-_\s]?policy|content_filter|safety/i.test(lowerBody)) {
    return new LLMError({
      module: "LLMExecutor",
      method,
      reason: new ContentPolicyReason({ retryable: false }),
    });
  }

  if (status === 401) {
    return new LLMError({
      module: "LLMExecutor",
      method,
      reason: new AuthenticationReason({
        kind: "invalid",
        retryable: false,
      }),
    });
  }

  if (status === 403) {
    return new LLMError({
      module: "LLMExecutor",
      method,
      reason: new AuthenticationReason({
        kind: "insufficient-permissions",
        retryable: false,
      }),
    });
  }

  if (status === 429) {
    if (/insufficient[-_\s]?quota|quota[-_\s]?exceeded/i.test(lowerBody)) {
      return new LLMError({
        module: "LLMExecutor",
        method,
        reason: new QuotaExceededReason({ retryable: false }),
      });
    }
    const retryAfterMs = parseRetryAfter(body);
    return new LLMError({
      module: "LLMExecutor",
      method,
      reason: new RateLimitReason({ retryable: true, retryAfterMs }),
    });
  }

  if (
    status === 400 ||
    status === 404 ||
    status === 409 ||
    status === 413 ||
    status === 422
  ) {
    const classification =
      /context.*length|too.*long|maximum.*context|reduce.*length/i.test(
        lowerBody,
      )
        ? "context-overflow"
        : undefined;
    return new LLMError({
      module: "LLMExecutor",
      method,
      reason: new InvalidRequestReason({ retryable: false, classification }),
    });
  }

  if (status >= 500 || isRetryableStatus(status)) {
    const retryAfterMs = parseRetryAfter(body);
    return new LLMError({
      module: "LLMExecutor",
      method,
      reason: new ProviderInternalReason({
        status,
        retryable: true,
        retryAfterMs,
      }),
    });
  }

  return new LLMError({
    module: "LLMExecutor",
    method,
    reason: new UnknownProviderReason({ retryable: false, status }),
  });
}

function parseRetryAfter(body: string): number | undefined {
  const match = body.match(/retry[-_\s]?after[:\s]+(\d+)/i);
  if (match) return parseInt(match[1], 10) * 1000;
  return undefined;
}

export interface ProviderCallInput {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

const executeOnce = (
  input: ProviderCallInput,
  method: string,
): Effect.Effect<ProviderApiResponse, LLMError> =>
  Effect.tryPromise({
    try: async () => {
      const res = await fetch(input.url, {
        method: input.method,
        headers: input.headers,
        body: input.body,
      });
      const body = await res.text();
      return {
        status: res.status,
        body,
        headers: Object.fromEntries(res.headers.entries()),
      };
    },
    catch: (err): LLMError =>
      new LLMError({
        module: "LLMExecutor",
        method,
        reason: new TransportReason({
          kind: err instanceof Error ? err.message : String(err),
          retryable: false,
        }),
      }),
  }).pipe(
    Effect.flatMap((response) => {
      if (response.status < 400) return Effect.succeed(response);
      return Effect.fail(classifyError(response.status, response.body, method));
    }),
  );

function retryDelay(error: LLMError, attempt: number): Effect.Effect<number> {
  if (error.retryAfterMs !== undefined) {
    return Effect.succeed(Math.min(error.retryAfterMs, MAX_DELAY_MS));
  }
  return Random.nextBetween(
    Math.min(BASE_DELAY_MS * 2 ** attempt * 0.8, MAX_DELAY_MS),
    Math.min(BASE_DELAY_MS * 2 ** attempt * 1.2, MAX_DELAY_MS),
  ).pipe(Effect.map((d) => Math.round(d)));
}

function retryCall(
  input: ProviderCallInput,
  method: string,
  retriesLeft = MAX_RETRIES,
  attempt = 0,
): Effect.Effect<ProviderApiResponse, LLMError> {
  return Effect.catchTag(executeOnce(input, method), "LLMError", (error) => {
    if (!error.retryable || retriesLeft <= 0) return Effect.fail(error);
    return retryDelay(error, attempt).pipe(
      Effect.flatMap((delay) => Effect.sleep(delay)),
      Effect.flatMap(() =>
        retryCall(input, method, retriesLeft - 1, attempt + 1),
      ),
    );
  });
}

export const providerCall = (
  input: ProviderCallInput,
): Effect.Effect<ProviderApiResponse, LLMError> =>
  retryCall(input, "streamResponse");
