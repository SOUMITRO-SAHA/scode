import type { Command } from "@/components/commands/commands.js";

export interface AutocompleteItem {
  name: string;
  description: string;
  category: Command["category"] | "skill";
  aliases: string[];
  usage: string;
  handler: Command["handler"];
}

export interface AutocompleteState {
  visible: boolean;
  query: string;
  selectedIndex: number;
  items: AutocompleteItem[];
  categories: string[];
  maxNameLen: number;
}

export interface ComposerLayout {
  boxWidth: number;
  inputWidth: number;
  borderPad: number;
  autoWidth: number;
  autoHeight: number;
}

export interface ModelInfo {
  modelName: string;
  providerName: string;
  hasModel: boolean;
}
