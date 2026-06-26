import type { DialogContextValue } from "@/components/ui/dialog.js";
import type { ApiClient } from "@/services/api";
import type { AppConfig } from "@scode/shared/types";

export interface Command {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  category:
    | "general"
    | "provider"
    | "model"
    | "session"
    | "skill"
    | "config"
    | "debug";
  suggested?: boolean;
  handler: (
    args: string[],
    api: ApiClient,
    ctx: CommandContext,
  ) => Promise<CommandResult | void>;
}

export interface CommandContext {
  model?: string;
  serverUrl: string;
  currentSessionId?: string;
  debugEnabled: boolean;
  setModel?: (m: string) => void;
  setCurrentSessionId?: (id: string | undefined) => void;
  clearMessages?: () => void;
  toggleDebug?: () => void;
  openModelPicker?: () => void;
  openProviderPicker?: () => void;
  addSystemMessage?: (text: string) => void;
  onExit?: () => void;
}

export interface CommandResult {
  type: "message" | "error" | "clear" | "exit" | "debug_toggle";
  text?: string;
}

export function parseCommand(
  input: string,
): { command: string; args: string[] } | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return null;
  const parts = trimmed.slice(1).split(/\s+/);
  return { command: parts[0].toLowerCase(), args: parts.slice(1) };
}

export const COMMANDS: Command[] = [
  {
    name: "help",
    aliases: ["h"],
    description: "Display all available commands",
    usage: "/help",
    category: "general",
    suggested: true,
    handler: async (_args, _api, ctx) => {
      const lines = COMMANDS.map((c) => {
        const aliases = c.aliases.length
          ? ` (${c.aliases.map((a) => `/${a}`).join(", ")})`
          : "";
        return `  ${c.usage}${aliases}  ${c.description}`;
      });
      return {
        type: "message",
        text: `\nAvailable Commands:\n${lines.join("\n")}\n`,
      };
    },
  },
  {
    name: "clear",
    aliases: [],
    description: "Clear the current conversation window",
    usage: "/clear",
    category: "general",
    suggested: true,
    handler: async (_args, _api, ctx) => {
      ctx.clearMessages?.();
      ctx.addSystemMessage?.("Conversation cleared");
    },
  },
  {
    name: "new",
    aliases: ["n"],
    description: "Create a new conversation session",
    usage: "/new",
    category: "session",
    suggested: true,
    handler: async (_args, api, ctx) => {
      const config = await api.getConfig();
      const model = ctx.model ?? config.defaultModel;
      if (!model) {
        return {
          type: "error",
          text: "No model selected. Use Ctrl+M or /models command to select a model first.",
        };
      }
      const session = await api.createSession("", model);
      ctx.setCurrentSessionId?.(session.id);
      ctx.clearMessages?.();
      ctx.setModel?.(`${session.provider}/${session.model}`);
      return {
        type: "message",
        text: `New session created: ${session.name} (${session.id.slice(0, 8)}...)`,
      };
    },
  },
  {
    name: "rename",
    aliases: [],
    description: "Rename the current conversation",
    usage: "/rename <name>",
    category: "session",
    handler: async (args, api, ctx) => {
      const name = args.join(" ");
      if (!name || !ctx.currentSessionId)
        return { type: "error", text: "Usage: /rename <name>" };
      await api.renameSession(ctx.currentSessionId, name);
      return { type: "message", text: `Session renamed to: ${name}` };
    },
  },
  {
    name: "delete",
    aliases: ["del"],
    description: "Delete the current conversation",
    usage: "/delete",
    category: "session",
    handler: async (_args, api, ctx) => {
      if (!ctx.currentSessionId)
        return { type: "error", text: "No active session" };
      await api.deleteSession(ctx.currentSessionId);
      ctx.setCurrentSessionId?.(undefined);
      ctx.clearMessages?.();
      return { type: "message", text: "Session deleted" };
    },
  },
  {
    name: "history",
    aliases: ["hist"],
    description: "Show previous prompts in the current conversation",
    usage: "/history",
    category: "session",
    handler: async (_args, api, ctx) => {
      if (!ctx.currentSessionId)
        return { type: "error", text: "No active session" };
      const { messages } = await api.getMessages(ctx.currentSessionId);
      const lines = messages.map(
        (m, i) =>
          `  ${i + 1}. [${m.role}] ${typeof m.content === "string" ? m.content.slice(0, 100) : "(structured)"}`,
      );
      return {
        type: "message",
        text: `\nSession Messages (${messages.length}):\n${lines.join("\n")}\n`,
      };
    },
  },
  {
    name: "session",
    aliases: ["sessions", "s"],
    description: "List, switch, or delete chat sessions",
    usage: "/session [switch|delete] [id]",
    category: "session",
    suggested: true,
    handler: async (args, api, ctx) => {
      if ((args[0] === "switch" || args[0] === "s") && args[1]) {
        const session = await api.getSession(args[1]);
        ctx.setCurrentSessionId?.(session.id);
        ctx.clearMessages?.();
        return {
          type: "message",
          text: `Switched to session: ${session.name} (${session.id.slice(0, 8)}...)`,
        };
      }
      if (
        (args[0] === "delete" || args[0] === "del" || args[0] === "d") &&
        args[1]
      ) {
        await api.deleteSession(args[1]);
        return {
          type: "message",
          text: `Session deleted: ${args[1].slice(0, 8)}...`,
        };
      }
      const { sessions } = await api.listSessions();
      const lines = sessions.map(
        (s, i) =>
          `  ${i + 1}. ${s.name} (${s.id.slice(0, 8)}...) — ${s.messageCount} msgs`,
      );
      return { type: "message", text: `\nSessions:\n${lines.join("\n")}\n` };
    },
  },
  {
    name: "connect",
    aliases: [],
    description: "Connect a provider with an API key",
    usage: "/connect <provider> <apiKey>",
    category: "provider",
    handler: async (args, api) => {
      if (args.length < 2)
        return { type: "error", text: "Usage: /connect <provider> <apiKey>" };
      const result = await api.connectProvider(args[0], args[1]);
      return {
        type: "message",
        text: `Provider connected: ${result.provider}`,
      };
    },
  },
  {
    name: "providers",
    aliases: ["provider"],
    description: "Manage providers — connect, disconnect, set default",
    usage: "/providers [connect <id> <key>|disconnect <id>|use <id>]",
    category: "provider",
    handler: async (args, api, ctx) => {
      if (args[0] === "connect" && args[1] && args[2]) {
        const result = await api.connectProvider(args[1], args[2]);
        return {
          type: "message",
          text: `Provider connected: ${result.provider}`,
        };
      }
      if (args[0] === "disconnect" && args[1]) {
        await api.disconnectProvider(args[1]);
        return { type: "message", text: `Provider disconnected: ${args[1]}` };
      }
      if (args[0] === "use" && args[1]) {
        const result = await api.setDefaultProvider(args[1]);
        ctx.setModel?.(`${result.provider}/${result.defaultModel}`);
        return {
          type: "message",
          text: `Default provider: ${result.provider} (model: ${result.defaultModel})`,
        };
      }
      ctx.openProviderPicker?.();
    },
  },
  {
    name: "disconnect",
    aliases: [],
    description: "Disconnect a provider",
    usage: "/disconnect <provider>",
    category: "provider",
    handler: async (args, api) => {
      if (!args[0])
        return { type: "error", text: "Usage: /disconnect <provider>" };
      await api.disconnectProvider(args[0]);
      return { type: "message", text: `Provider disconnected: ${args[0]}` };
    },
  },
  {
    name: "models",
    aliases: ["model"],
    description: "List available models or set the default model",
    usage: "/models or /model use <model>",
    category: "model",
    handler: async (args, api, ctx) => {
      if (args[0] === "use" && args[1]) {
        const result = await api.setDefaultModel(args[1]);
        ctx.setModel?.(args[1]);
        return { type: "message", text: `Default model: ${result.model}` };
      }
      ctx.openModelPicker?.();
    },
  },
  {
    name: "skills",
    aliases: ["skill"],
    description: "List, inspect, reload, or validate skills",
    usage: "/skills [info|reload|validate] [name]",
    category: "skill",
    handler: async (args, api) => {
      if (args[0] === "info" && args[1]) {
        const skill = await api.getSkill(args[1]);
        return {
          type: "message",
          text: `\nSkill: ${skill.name}\nDescription: ${skill.description}\nBody:\n${skill.body}\n`,
        };
      }
      if (args[0] === "reload") {
        const result = await api.reloadSkills();
        return { type: "message", text: result.message };
      }
      if (args[0] === "validate") {
        const { results } = await api.validateSkills();
        const lines = results.map(
          (r) => `  ${r.name} — ${r.valid ? "OK valid" : "ERROR: " + r.error}`,
        );
        return {
          type: "message",
          text: `\nSkill Validation:\n${lines.join("\n")}\n`,
        };
      }
      const { skills } = await api.listSkills();
      if (skills.length === 0)
        return { type: "message", text: "No skills installed" };
      const lines = skills.map((s) => `  ${s.name} — ${s.description}`);
      return {
        type: "message",
        text: `\nInstalled Skills:\n${lines.join("\n")}\n`,
      };
    },
  },
  {
    name: "config",
    aliases: ["cfg"],
    description: "View or set configuration",
    usage: "/config [set <key> <value>]",
    category: "config",
    handler: async (args, api) => {
      if (args[0] === "set" && args.length >= 2) {
        const key = args[1] as keyof AppConfig;
        const value = args.slice(2).join(" ");
        const num = Number(value);
        await api.updateConfig({ [key]: isNaN(num) ? value : num });
        return {
          type: "message",
          text: `Config updated: ${key} = ${isNaN(num) ? value : num}`,
        };
      }
      const config = await api.getConfig();
      const lines = Object.entries(config).map(([k, v]) => `  ${k}: ${v}`);
      return {
        type: "message",
        text: `\nConfiguration:\n${lines.join("\n")}\n`,
      };
    },
  },
  {
    name: "debug",
    aliases: ["dbg"],
    description: "Toggle debug panel",
    usage: "/debug",
    category: "debug",
    handler: async (_args, _api, ctx) => {
      ctx.toggleDebug?.();
      ctx.addSystemMessage?.("Debug toggled");
    },
  },
  {
    name: "logs",
    aliases: [],
    description: "View recent server logs",
    usage: "/logs",
    category: "debug",
    handler: async (_args, api) => {
      const { logs } = await api.getLogs();
      if (logs.length === 0) return { type: "message", text: "No logs found" };
      const lines = logs.flatMap((l) => [
        `--- ${l.file} (${l.size} bytes) ---`,
        l.content,
      ]);
      return { type: "message", text: `\n${lines.join("\n")}\n` };
    },
  },
  {
    name: "health",
    aliases: ["status"],
    description: "Check server status",
    usage: "/health",
    category: "debug",
    handler: async (_args, api) => {
      const health = await api.health();
      const lines = [
        `  Status: ${health.healthy ? "OK Healthy" : "FAIL Unhealthy"}`,
        `  Uptime: ${health.uptime}s`,
        `  Providers: ${health.providers}`,
        `  Sessions: ${health.sessions}`,
        `  Default: ${health.defaultProvider || "None"}/${health.defaultModel || "No model selected"}`,
      ];
      return {
        type: "message",
        text: `\nServer Status:\n${lines.join("\n")}\n`,
      };
    },
  },
  {
    name: "quit",
    aliases: ["exit", "q"],
    description: "Quit the application",
    usage: "/quit",
    category: "general",
    handler: async (_args, _api, ctx) => {
      ctx.onExit?.();
    },
  },
  {
    name: "agent",
    aliases: [],
    description: "Show current agent information",
    usage: "/agent",
    category: "general",
    handler: async (_args, api, ctx) => {
      const config = await api.getConfig();
      const modelStr = ctx.model ?? config.defaultModel;
      return {
        type: "message",
        text: `\nAgent: scode\n  Model: ${modelStr || "No model selected"}\n  Provider: ${config.defaultProvider || "None"}\n  Session: ${ctx.currentSessionId?.slice(0, 8) ?? "none"}\n`,
      };
    },
  },
  {
    name: "context",
    aliases: ["ctx"],
    description: "Show current context information",
    usage: "/context",
    category: "general",
    handler: async (_args, api, ctx) => {
      const config = await api.getConfig();
      const modelStr = ctx.model ?? config.defaultModel;
      return {
        type: "message",
        text: `\nContext:\n  Model: ${modelStr || "No model selected"}\n  Provider: ${config.defaultProvider || "None"}\n  Session: ${ctx.currentSessionId?.slice(0, 8) ?? "none"}\n  Debug: ${ctx.debugEnabled ? "on" : "off"}\n`,
      };
    },
  },
];

export async function executeCommand(
  input: string,
  api: ApiClient,
  ctx: CommandContext,
): Promise<CommandResult | void> {
  const parsed = parseCommand(input);
  if (!parsed) return;

  const { command, args } = parsed;
  for (const cmd of COMMANDS) {
    if (cmd.name === command || cmd.aliases.includes(command)) {
      try {
        return cmd.handler(args, api, ctx);
      } catch (err) {
        return {
          type: "error",
          text: `Error /${command}: ${(err as Error).message}`,
        };
      }
    }
  }
  return { type: "error", text: `Unknown: /${command}. Try /help` };
}
