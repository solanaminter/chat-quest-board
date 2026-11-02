# Chat Quest Board

Turn passive Twitch viewers into players: viewers join quests by typing
`!quest` / `!join` in chat, and shared quest progress renders live on stream
as a browser-source overlay.

## Quest types (v1)

1. **Chat Race** — first N chat messages completes it.
2. **Welcome Wagon** — first-time chatters join a welcome quest.
3. **Hype Meter** — emote count goal.

## Chat commands

- `!quest` / `!quests` — show the active quest and progress
- `!join` — join the active quest
- `!leaderboard` — top 5 chatters
- `!help` — list commands

Every chat message also feeds quest progress (chat race counts messages,
hype meter counts emotes).

## Run

```bash
npm install
npm run dev
```

- Overlay (add as a browser source in OBS, 1920×1080, transparent):
  `http://localhost:3000/overlay.html`
- Streamer panel: `http://localhost:3000/panel.html`

State is kept in memory and persisted to `state.json` (gitignored) on change.

## Twitch setup

1. Create an app at https://dev.twitch.tv/console/apps (redirect URL can be
   `http://localhost` for a chat-only bot).
2. Generate a chat OAuth token for the bot account.
3. Copy `.env.example` to `.env` and fill in `TWITCH_BOT_USERNAME`,
   `TWITCH_OAUTH_TOKEN` (with the `oauth:` prefix) and `TWITCH_CHANNEL`.
4. Restart. Without credentials the server still runs and the panel's
   local-test controls simulate chat messages for verification — those are
   clearly labeled and are not Twitch chat.

## Status note (Nov 1, 2026)

This build was written directly in this workspace because the planned Codex
CLI thread could not run in this sandbox: `codex exec` stalled on an
approval-gated backend call (Sentinel policy, `POST /backend-api/ps/mcp`,
HTTP 403, "background action is still awaiting approval"). A Codex session
(`01a1980f-dffe-71b2-9508-9fc8119e1277`) was opened with the build prompt
but its agent loop never produced code. Before filing, run the build prompt
(or an iterate-and-verify pass over this code) in a live Codex thread and
use that thread's real session ID in the Devpost form — do not claim this
code was Codex-built until a Codex thread has genuinely worked on it.
