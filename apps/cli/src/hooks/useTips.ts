import { useEffect, useState } from "react";

const TIPS = [
  "Run /skills to list available skills.",
  "Use @filename to include a file in your prompt.",
  "Press Tab to switch models.",
  "Type /help for all available commands.",
  "Use Ctrl+L to clear the conversation.",
];

export function useTips() {
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * TIPS.length),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % TIPS.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return TIPS[index];
}
