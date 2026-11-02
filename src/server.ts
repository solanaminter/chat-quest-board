import express from "express";
import * as path from "path";
import { Board, QuestType } from "./state";
import { startBot } from "./bot";

const PORT = Number(process.env.PORT || 3000);
const board = new Board();
startBot(board);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/state", (_req, res) => {
  res.json(board.state);
});

app.post("/api/quests/start", (req, res) => {
  const { type, goal } = req.body as { type: QuestType; goal: number };
  if (!["chat-race", "newcomer-welcome", "hype-meter"].includes(type)) {
    res.status(400).json({ error: "unknown quest type" });
    return;
  }
  const g = Number(goal);
  if (!Number.isFinite(g) || g < 1) {
    res.status(400).json({ error: "goal must be a positive number" });
    return;
  }
  res.json(board.startQuest(type, g));
});

app.post("/api/quests/complete", (_req, res) => {
  const quest = board.completeQuest();
  if (!quest) {
    res.status(404).json({ error: "no active quest" });
    return;
  }
  res.json(quest);
});

app.post("/api/quests/reset", (_req, res) => {
  board.reset();
  res.json(board.state);
});

// Local-test only: simulate a chat message without Twitch credentials, so the
// overlay and panel can be verified before a channel is connected. The panel
// labels this control as a local test; it is not Twitch chat.
app.post("/api/test/chat", (req, res) => {
  const { username, message, emotes } = req.body as {
    username: string;
    message: string;
    emotes: number;
  };
  if (!username || typeof message !== "string") {
    res.status(400).json({ error: "username and message required" });
    return;
  }
  const reply = board.handleChat(username, message, Number(emotes) || 0);
  res.json({ reply, state: board.state });
});

app.listen(PORT, () => {
  console.log(`Chat Quest Board server on http://localhost:${PORT}`);
  console.log(`  Overlay: http://localhost:${PORT}/overlay.html`);
  console.log(`  Panel:   http://localhost:${PORT}/panel.html`);
});
