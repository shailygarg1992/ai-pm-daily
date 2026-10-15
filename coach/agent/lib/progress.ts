import { defineState } from "eve/context";

export type QuizAttempt = {
  day: number;
  index: number;
  level: "beginner" | "advanced";
  correct: boolean;
};

export const progress = defineState("ai-pm-coach.progress", () => ({
  lessonsViewed: [] as number[],
  attempts: [] as QuizAttempt[],
}));
