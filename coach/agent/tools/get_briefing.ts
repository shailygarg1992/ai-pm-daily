import { defineTool } from "eve/tools";
import { z } from "zod";
import { DAYS } from "../lib/curriculum";
import { levelSchema } from "../lib/level";
import { progress } from "../lib/progress";

export default defineTool({
  description:
    "Get the 5-minute briefing for one curriculum day: its key points, each with a real-world example. Teach from this content.",
  label: { start: ({ day }) => `Pulling up the Day ${day} briefing` },
  inputSchema: z.object({
    day: z.number().int().min(1).max(7),
    level: levelSchema,
  }),
  execute({ day, level }) {
    const d = DAYS.find((x) => x.day === day);
    if (!d) throw new Error(`No day ${day}. Days run 1–7.`);
    progress.update((p) => ({
      ...p,
      lessonsViewed: p.lessonsViewed.includes(day) ? p.lessonsViewed : [...p.lessonsViewed, day],
    }));
    return {
      day: d.day,
      theme: d.theme,
      level,
      points: d.briefing.map((b, i) => ({
        point: i + 1,
        idea: level === "advanced" ? b.advancedText : b.text,
        example: level === "advanced" ? b.advancedExample : b.example,
      })),
    };
  },
});
