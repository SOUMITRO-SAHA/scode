import { TextAttributes } from "@opentui/core";
import { theme } from "@scode/theme";

export function SkillPills({ skills }: { skills: string[] }) {
  if (skills.length === 0) return null;

  return (
    <box flexDirection="row" flexWrap="wrap" paddingBottom={1}>
      {skills.map((name) => (
        <box
          key={name}
          borderStyle="rounded"
          borderColor={theme.brand.subtle}
          flexDirection="row"
          paddingLeft={1}
          paddingRight={1}
          flexShrink={0}
        >
          <text
            content="SKILL"
            fg={theme.text.muted}
            attributes={TextAttributes.BOLD}
          />
          <text
            content={` @${name}`}
            fg={theme.brand.primary}
            attributes={TextAttributes.BOLD}
          />
        </box>
      ))}
    </box>
  );
}
