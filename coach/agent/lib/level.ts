import { z } from "zod";

export const levelSchema = z
  .enum(["beginner", "advanced"])
  .default("beginner")
  .describe("beginner = plain language and analogies; advanced = technical depth and real products.");
