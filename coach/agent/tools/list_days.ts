import { defineTool } from "eve/tools";
import { z } from "zod";
import { DAYS } from "../lib/curriculum";

export default defineTool({
  description: "List the 7 days of the AI PM Daily curriculum with their themes.",
  label: { start: () => "Opening the curriculum" },
  inputSchema: z.object({}),
  execute() {
    return DAYS.map((d) => ({ day: d.day, theme: d.theme, quizQuestions: d.quiz.length }));
  },
});
