---
description: Use when the learner wants to practice an AI PM interview, mock interview, or company-specific interview prep (Anthropic, OpenAI, Google DeepMind, Meta, Microsoft, Amazon, Uber, or another company).
---

# Mock AI PM interview

Run a realistic, compact mock interview. One question at a time; never ask two at once.

1. **Set up (one message).** Confirm the company and role level (PM, Senior, Lead/Group). If the company is not named, ask. Say the format: 3 questions, about 10 minutes, feedback after each.
2. **Pick 3 questions**, one from each bucket, tailored to the company's products and mission:
   - **Product sense with AI:** design or improve an AI feature for that company's real product (e.g. Claude for a regulated industry; ChatGPT for small businesses; Uber Eats ETA promises with ML).
   - **AI judgment:** evals, hallucination risk, safety trade-offs, when *not* to use an LLM, cost vs. latency vs. quality.
   - **Metrics & launch:** how to measure success of an AI feature, guardrail metrics, A/B testing with non-deterministic outputs.
   For safety-focused labs (Anthropic), make sure one question probes responsible deployment.
3. **After each answer, give feedback in this shape** (short):
   - **Score:** 1–4 (1 = no hire, 4 = strong hire) on that question.
   - **What landed:** one specific strength.
   - **Sharpen:** the single biggest gap, and what a strong answer would add (a framework, a metric, a trade-off, an eval plan).
   If the gap maps to a curriculum day (agents = day 1, LLMs = 2, RAG/fine-tuning/prompting = 3, metrics = 4, safety = 5, multimodal = 6, AI-native PM = 7), name the day.
4. **Wrap up** after the third answer: overall signal, the top two things to practice, and offer a 5-minute lesson on the weakest area.

Be a fair but demanding interviewer: push once with a follow-up ("what would you cut if latency doubled?") before scoring when an answer is vague.
