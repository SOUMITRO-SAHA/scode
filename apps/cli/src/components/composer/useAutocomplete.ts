import { useMemo } from "react";

import fuzzysort from "fuzzysort";

import type { AutocompleteItem } from "./types";

import { COMMANDS } from "@/components/commands/commands";
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
    if (!query) {
      return COMMANDS.map((c) => ({
        ...c,
        suggested: c.suggested,
      }));
    }
    return fuzzysort
      .go(query, COMMANDS, {
        keys: [
          (c) => "/" + c.name,
          (c) => c.aliases.map((a) => "/" + a).join(" "),
          "description",
          "category",
        ],
        limit: 10,
        scoreFn: (objResults) => {
          const nameResult = objResults[0];
          let score = objResults.score;
          if (nameResult) {
            const target = nameResult.target.toLowerCase();
            const q = query.toLowerCase();
            if (target === "/" + q || target === q) {
              score *= 4;
            } else if (target.startsWith("/" + q) || target.startsWith(q)) {
              score *= 2;
            }
          }
          return score;
        },
      })
      .map((r) => ({
        ...r.obj,
        suggested: r.obj.suggested,
      }));
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

  const items = useMemo(() => {
    const cmdItems: AutocompleteItem[] = filteredCommands.map((c) => ({
      name: c.name,
      description: c.description,
      category: c.category,
      aliases: c.aliases,
      usage: c.usage,
      handler: c.handler,
      suggested: c.suggested,
    }));

    const skillItems: AutocompleteItem[] = filteredSkills.map((s) => ({
      name: s.name,
      description: s.description,
      category: "skill" as const,
      aliases: [],
      usage: `/skill ${s.name}`,
      handler: async () => {},
      suggested: false,
    }));

    return [...cmdItems, ...skillItems];
  }, [filteredCommands, filteredSkills]);

  const categories = useMemo(() => {
    return [...new Set(items.map((c) => c.category))];
  }, [items]);

  const maxNameLen = useMemo(
    () => Math.max(...items.map((c) => c.name.length), 0),
    [items],
  );

  return { items, categories, maxNameLen };
}
