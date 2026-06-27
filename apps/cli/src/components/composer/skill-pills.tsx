import { TextAttributes } from "@opentui/core";
import { theme } from "@scode/theme";

export function SkillPills({ skills }: { skills: string[] }) {
  if (skills.length === 0) return null;

  return (
    <box paddingLeft={1} flexDirection="row" flexShrink={0} gap={1}>
      {skills.map((name) => (
        <text
          key={name}
          content={`@${name}`}
          fg={theme.brand.primary}
          attributes={TextAttributes.BOLD}
        />
      ))}
    </box>
  );
}
