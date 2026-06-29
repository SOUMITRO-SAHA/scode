import { Data } from "effect";

export class InvalidRequestReason extends Data.TaggedError(
  "InvalidRequestReason",
)<{
  readonly parameter?: string;
  readonly classification?: string;
  readonly retryable: false;
}> {
  get message(): string {
    return `Invalid request${this.parameter ? `: ${this.parameter}` : ""}${this.classification ? ` (${this.classification})` : ""}`;
  }
}

export class AuthenticationReason extends Data.TaggedError(
  "AuthenticationReason",
)<{
  readonly kind:
    | "missing"
    | "invalid"
    | "expired"
    | "insufficient-permissions"
    | "unknown";
  readonly retryable: false;
}> {
  get message(): string {
    return `Authentication failed: ${this.kind}`;
  }
}

export class RateLimitReason extends Data.TaggedError("RateLimitReason")<{
  readonly retryAfterMs?: number;
  readonly retryable: true;
}> {
  get message(): string {
    return `Rate limit exceeded${this.retryAfterMs ? ` (retry after ${this.retryAfterMs}ms)` : ""}`;
  }
}

export class QuotaExceededReason extends Data.TaggedError(
  "QuotaExceededReason",
)<{
  readonly retryable: false;
}> {
  get message(): string {
    return "Quota exceeded";
  }
}

export class ContentPolicyReason extends Data.TaggedError(
  "ContentPolicyReason",
)<{
  readonly retryable: false;
}> {
  get message(): string {
    return "Content policy violation";
  }
}

export class ProviderInternalReason extends Data.TaggedError(
  "ProviderInternalReason",
)<{
  readonly status: number;
  readonly retryAfterMs?: number;
  readonly retryable: true;
}> {
  get message(): string {
    return `Provider internal error (${this.status})${this.retryAfterMs ? ` (retry after ${this.retryAfterMs}ms)` : ""}`;
  }
}

export class TransportReason extends Data.TaggedError("TransportReason")<{
  readonly kind?: string;
  readonly retryable: false;
}> {
  get message(): string {
    return `Transport error${this.kind ? `: ${this.kind}` : ""}`;
  }
}

export class InvalidProviderOutputReason extends Data.TaggedError(
  "InvalidProviderOutputReason",
)<{
  readonly route?: string;
  readonly raw?: string;
  readonly retryable: false;
}> {
  get message(): string {
    return `Invalid provider output${this.route ? ` from ${this.route}` : ""}`;
  }
}

export class UnknownProviderReason extends Data.TaggedError(
  "UnknownProviderReason",
)<{
  readonly status?: number;
  readonly retryable: false;
}> {
  get message(): string {
    return `Unknown provider error${this.status ? ` (${this.status})` : ""}`;
  }
}

export type LLMErrorReason =
  | InvalidRequestReason
  | AuthenticationReason
  | RateLimitReason
  | QuotaExceededReason
  | ContentPolicyReason
  | ProviderInternalReason
  | TransportReason
  | InvalidProviderOutputReason
  | UnknownProviderReason;

export class LLMError extends Data.TaggedError("LLMError")<{
  readonly module: string;
  readonly method: string;
  readonly reason: LLMErrorReason;
}> {
  override readonly cause = this.reason;

  get retryable(): boolean {
    return this.reason.retryable;
  }

  get retryAfterMs(): number | undefined {
    return "retryAfterMs" in this.reason
      ? (this.reason as RateLimitReason | ProviderInternalReason).retryAfterMs
      : undefined;
  }

  override get message(): string {
    return `${this.module}.${this.method}: ${this.reason.message}`;
  }
}
