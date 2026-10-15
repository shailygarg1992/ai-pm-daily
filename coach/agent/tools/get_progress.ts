import { defineTool } from "eve/tools";
import { z } from "zod";
import { DAYS } from "../lib/curriculum";
import { progress } from "../lib/progress";

export default defineTool({
  description:
    "Summarize the learner's progress this session: lessons viewed, quiz score per day, and the weakest day to study next.",
  label: { start: () => "Checking your progress" },
  inputSchema: z.object({}),
  execute() {
    const { lessonsViewed, attempts } = progress.get();
    const byDay = DAYS.map((d) => {
      const tries = attempts.filter((a) => a.day === d.day);
      const right = tries.filter((a) => a.correct).length;
      return {
        day: d.day,
        theme: d.theme,
        lessonViewed: lessonsViewed.includes(d.day),
        answered: tries.length,
        correct: right,
        accuracy: tries.length ? Math.round((100 * right) / tries.length) : null,
      };
    });
    const tried = byDay.filter((d) => d.answered > 0);
    const weakest = [...tried].sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))[0];
    const nextUnseen = byDay.find((d) => !d.lessonViewed && d.answered === 0);
    return {
      totalAnswered: attempts.length,
      totalCorrect: attempts.filter((a) => a.correct).length,
      byDay,
      recommendNext:
        weakest && (weakest.accuracy ?? 100) < 80
          ? { day: weakest.day, reason: `Lowest quiz accuracy (${weakest.accuracy}%).` }
          : nextUnseen
            ? { day: nextUnseen.day, reason: "Next lesson you haven't started." }
            : null,
    };
  },
});
