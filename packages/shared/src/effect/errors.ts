import { Data } from "effect";

export class ApiFetchError extends Data.TaggedError("ApiFetchError")<{
  readonly url: string;
  readonly method: string;
  readonly status?: number;
}> {
  override get message(): string {
    let msg = `${this.method.toUpperCase()} ${this.url} failed`;
    if (this.status !== undefined) msg += ` (${this.status})`;
    return msg;
  }
}

export class ApiStreamError extends Data.TaggedError("ApiStreamError")<{
  readonly url: string;
  readonly status?: number;
}> {
  override get message(): string {
    let msg = `Stream to ${this.url} failed`;
    if (this.status !== undefined) msg += ` (${this.status})`;
    return msg;
  }
}

export class ApiUrlError extends Data.TaggedError("ApiUrlError")<{
  readonly path: string;
}> {
  override get message(): string {
    return `Invalid API URL for path "${this.path}"`;
  }
}

export class ConfigError extends Data.TaggedError("ConfigError")<{
  readonly key: string;
}> {
  override get message(): string {
    return `Config error for "${this.key}"`;
  }
}

export class IdGenerationError extends Data.TaggedError(
  "IdGenerationError",
)<{}> {
  override get message(): string {
    return "ID generation failed";
  }
}

export class ModelParseError extends Data.TaggedError("ModelParseError")<{
  readonly input: string;
}> {
  override get message(): string {
    return `Failed to parse model string "${this.input}": Expected format: provider/model`;
  }
}

export class LoggerError extends Data.TaggedError("LoggerError")<{
  readonly operation: string;
}> {
  override get message(): string {
    return `Logger ${this.operation} failed`;
  }
}
