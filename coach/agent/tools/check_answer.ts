import { defineTool } from "eve/tools";
import { z } from "zod";
import { DAYS } from "../lib/curriculum";
import { levelSchema } from "../lib/level";
import { progress } from "../lib/progress";

export default defineTool({
  description:
    "Grade the learner's answer to a quiz question from ask_quiz_question and record it in their progress. Returns whether it was right, the correct option, and a short video to learn the concept if they missed it.",
  label: { start: ({ choice }) => `Grading answer ${choice}` },
  inputSchema: z.object({
    day: z.number().int().min(1).max(7),
    index: z.number().int().min(0).max(9),
    choice: z.enum(["A", "B", "C", "D"]).describe("The letter the learner chose."),
    level: levelSchema,
  }),
  execute({ day, index, choice, level }) {
    const q = DAYS.find((x) => x.day === day)?.quiz[index];
    if (!q) throw new Error(`No question ${index} on day ${day}.`);
    const advanced = level === "advanced";
    const options: readonly string[] = advanced ? q.advancedOptions : q.options;
    const answer: number = advanced ? q.advancedAnswer : q.answer;
    const chosen = "ABCD".indexOf(choice);
    const correct = chosen === answer;
    progress.update((p) => ({
      ...p,
      attempts: [
        ...p.attempts.filter((a) => !(a.day === day && a.index === index && a.level === level)),
        { day, index, level, correct },
      ],
    }));
    return {
      correct,
      chose: { letter: choice, text: options[chosen] },
      correctOption: { letter: "ABCD"[answer], text: options[answer] },
      learnLinks: correct ? [] : q.learnLinks,
    };
  },
});
