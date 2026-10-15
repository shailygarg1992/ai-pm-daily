import { defineChannel, GET, HEAD } from "eve/channels";
import { HOME_HTML } from "../lib/home-html";

const page = () =>
  new Response(HOME_HTML, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" },
  });

// The agent's own URL opens the phone-first AI PM Coach chat.
export default defineChannel({
  routes: [GET("/", async () => page()), HEAD("/", async () => page())],
});
