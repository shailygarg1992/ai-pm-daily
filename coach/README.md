# AI PM Coach (eve agent)

The durable AI tutor behind the **AI Coach** tab in AI PM Daily. Built with [eve](https://eve.dev), Vercel's agent framework.

- `agent/instructions.md` – who the coach is and how it teaches
- `agent/tools/` – `list_days`, `get_briefing`, `ask_quiz_question`, `check_answer`, `get_progress`, `web_search`
- `agent/skills/mock-interview.md` – company-specific AI PM mock interview, loaded on demand
- `agent/lib/curriculum.ts` – generated from `../src/data.js` (`npm run sync-curriculum`)
- `agent/channels/eve.ts` – public HTTP API with CORS for the web app; spend capped per session in `agent/agent.ts`

## Run locally (Node 24)

```bash
npm install
npx eve dev          # terminal chat; sign in to Vercel/AI Gateway when asked
```

## Deploy

```bash
npx eve deploy       # creates/links a Vercel project and deploys to production
curl https://<coach-url>/eve/v1/health
```

Then set `VITE_COACH_URL=https://<coach-url>` on the AI PM Daily Vercel project and redeploy it.
