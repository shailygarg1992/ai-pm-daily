import { eveChannel } from "eve/channels/eve";
import { localDev, none, vercelOidc } from "eve/channels/auth";

export default eveChannel({
  // Public demo: anonymous visitors of the AI PM Daily app can chat.
  // Spend is capped per session in agent.ts.
  auth: [vercelOidc(), localDev(), none()],
  // The AI PM Daily web app calls this agent from the browser.
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["content-type", "last-event-id"],
  },
});
