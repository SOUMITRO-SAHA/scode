/**
 * CliConfig - Configuration service for CLI platform.
 */
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";

export interface CliConfigShape {
  readonly port: number;
  readonly maxPolls: number;
  readonly pollInterval: number;
  readonly healthCheckTimeout: number;
}

export class CliConfig extends Context.Service<CliConfig, CliConfigShape>()(
  "scode/cli/platform/Config",
) {
  static readonly Default: CliConfigShape = {
    port: 4100,
    maxPolls: 30,
    pollInterval: 200,
    healthCheckTimeout: 5000,
  };

  static readonly Live = Layer.succeed(
    CliConfig,
    CliConfig.of(CliConfig.Default),
  );
}

export const baseUrl = (): string =>
  `http://127.0.0.1:${CliConfig.Default.port}`;
export const healthUrl = (): string => `${baseUrl()}/health`;
