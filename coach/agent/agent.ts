import { defineAgent } from "eve";

export default defineAgent({
  model: "anthropic/claude-sonnet-4.6",
  modelContextWindowTokens: 200_000,
  // Public demo: no shell/sandbox/file tools. The coach only uses its own
  // curriculum tools, the interview skill, and web search for fresh news.
  defaultTools: false,
  limits: {
    // Keeps a public demo from running up the AI Gateway bill.
    maxTokenCostUsdPerSession: 0.75,
    sessionTimeoutMs: 24 * 60 * 60 * 1_000,
  },
});
