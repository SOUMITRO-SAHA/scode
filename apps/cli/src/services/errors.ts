/**
 * Platform errors - Typed errors for CLI platform services.
 */
import * as Schema from "effect/Schema";

export class ServerConnectionError extends Schema.TaggedErrorClass<ServerConnectionError>()(
  "ServerConnectionError",
  {
    url: Schema.String,
    attempt: Schema.Number,
    cause: Schema.optional(Schema.Defect()),
  },
) {
  override get message(): string {
    return `Failed to connect to server at ${this.url} (attempt ${this.attempt})`;
  }
}

export class ServerStartError extends Schema.TaggedErrorClass<ServerStartError>()(
  "ServerStartError",
  {
    port: Schema.Number,
    timeout: Schema.Number,
    cause: Schema.optional(Schema.Defect()),
  },
) {
  override get message(): string {
    return `Server failed to start on port ${this.port} within ${this.timeout}ms`;
  }
}

export class ServerNotFoundError extends Schema.TaggedErrorClass<ServerNotFoundError>()(
  "ServerNotFoundError",
  {
    port: Schema.Number,
    attempts: Schema.Number,
  },
) {
  override get message(): string {
    return `No server found on port ${this.port} after ${this.attempts} attempts`;
  }
}

export class StreamError extends Schema.TaggedErrorClass<StreamError>()(
  "StreamError",
  {
    sessionId: Schema.optional(Schema.String),
    message: Schema.String,
    cause: Schema.optional(Schema.Defect()),
  },
) {
  override get message(): string {
    const ctx = this.sessionId ? ` (session: ${this.sessionId})` : "";
    return `Stream error${ctx}: ${this.message}`;
  }
}

export class ClientRegistrationError extends Schema.TaggedErrorClass<ClientRegistrationError>()(
  "ClientRegistrationError",
  {
    cause: Schema.optional(Schema.Defect()),
  },
) {
  override get message(): string {
    return "Failed to register client with server";
  }
}

export class CliStartupError extends Schema.TaggedErrorClass<CliStartupError>()(
  "CliStartupError",
  {
    phase: Schema.String,
    cause: Schema.optional(Schema.Defect()),
  },
) {
  override get message(): string {
    return `CLI startup failed during ${this.phase}`;
  }
}

export class ShutdownError extends Schema.TaggedErrorClass<ShutdownError>()(
  "ShutdownError",
  {
    cause: Schema.optional(Schema.Defect()),
  },
) {
  override get message(): string {
    return "Error during graceful shutdown";
  }
}

export type PlatformError =
  | ServerConnectionError
  | ServerStartError
  | ServerNotFoundError
  | StreamError
  | ClientRegistrationError
  | CliStartupError
  | ShutdownError;
