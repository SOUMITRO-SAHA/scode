export type HeadlessMode =
  | { readonly kind: "prompt"; readonly text: string; readonly model?: string }
  | { readonly kind: "repl"; readonly model?: string }
  | { readonly kind: "serve" }
  | { readonly kind: "none" };

export interface CliArgs {
  readonly mode: HeadlessMode;
  readonly logEnabled?: boolean;
}
