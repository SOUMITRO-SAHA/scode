import { useMemo } from "react";

import fuzzysort from "fuzzysort";

import type { AutocompleteItem } from "./types";

import { COMMANDS } from "@/components/commands/commands.js";
import { useSkills } from "@/hooks/useApi";

interface UseAutocompleteOptions {
  query: string;
  serverUrl?: string;
}

interface UseAutocompleteResult {
  items: AutocompleteItem[];
  categories: string[];
  maxNameLen: number;
}

export function useAutocomplete({
  query,
  serverUrl,
}: UseAutocompleteOptions): UseAutocompleteResult {
  const { data: skillsData } = useSkills(serverUrl);

  const filteredCommands = useMemo(() => {
    if (!query) return COMMANDS;
    return fuzzysort
      .go(query, COMMANDS, {
        keys: ["name", (c) => c.aliases.join(" "), "description", "category"],
        limit: 10,
      })
      .map((r) => r.obj);
  }, [query]);

  const filteredSkills = useMemo(() => {
    if (!query || !skillsData?.skills) return skillsData?.skills ?? [];
    return fuzzysort
      .go(query, skillsData.skills, {
        keys: ["name", "description"],
        limit: 5,
      })
      .map((r) => r.obj);
  }, [query, skillsData]);

  const items = useMemo(
    () => [
      ...filteredCommands,
      ...filteredSkills.map((s) => ({
        name: s.name,
        description: s.description,
        category: "skill" as const,
        aliases: [],
        usage: `/skill ${s.name}`,
        handler: async () => {},
      })),
    ],
    [filteredCommands, filteredSkills],
  );

  const categories = useMemo(() => {
    return [...new Set(items.map((c) => c.category))];
  }, [items]);

  const maxNameLen = useMemo(
    () => Math.max(...items.map((c) => c.name.length), 0),
    [items],
  );

  return { items, categories, maxNameLen };
}
