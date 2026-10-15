import { defineTool } from "eve/tools";
import { z } from "zod";
import { DAYS, type QuizItem } from "../lib/curriculum";
import { levelSchema } from "../lib/level";
import { progress } from "../lib/progress";

export default defineTool({
  description:
    "Get one multiple-choice quiz question for a curriculum day. The correct answer is NOT returned; show the question and lettered options, wait for the learner, then call check_answer. Omit index to get the next unanswered question.",
  label: { start: ({ day }) => `Picking a Day ${day} quiz question` },
  inputSchema: z.object({
    day: z.number().int().min(1).max(7),
    index: z.number().int().min(0).max(9).optional(),
    level: levelSchema,
  }),
  execute({ day, index, level }) {
    const d = DAYS.find((x) => x.day === day);
    if (!d) throw new Error(`No day ${day}. Days run 1–7.`);
    const answered = new Set(
      progress.get().attempts.filter((a) => a.day === day && a.level === level).map((a) => a.index),
    );
    const i = index ?? d.quiz.findIndex((_, n) => !answered.has(n));
    if (i < 0) return { day, done: true, message: "All questions for this day are answered at this level." };
    const q = (d.quiz as readonly QuizItem[])[i];
    if (!q) throw new Error(`Day ${day} has ${d.quiz.length} questions (index 0–${d.quiz.length - 1}).`);
    const question = level === "advanced" ? q.advancedQuestion : q.question;
    const options = level === "advanced" ? q.advancedOptions : q.options;
    return {
      day,
      index: i,
      of: d.quiz.length,
      level,
      question,
      options: options.map((text, n) => ({ letter: "ABCD"[n], text })),
    };
  },
});
