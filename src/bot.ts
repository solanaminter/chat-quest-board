import tmi from "tmi.js";
import { Board } from "./state";

export function countEmotes(tags: tmi.ChatUserstate): number {
  // tmi.js parses emotes into tags.emotes: { emoteId: ["start-end", ...] }.
  if (!tags.emotes) return 0;
  return Object.values(tags.emotes).reduce((n, ranges) => n + ranges.length, 0);
}

export function startBot(board: Board): tmi.Client | null {
  const username = process.env.TWITCH_BOT_USERNAME;
  const password = process.env.TWITCH_OAUTH_TOKEN;
  const channel = process.env.TWITCH_CHANNEL;

  if (!username || !password || !channel) {
    console.warn(
      "Twitch credentials not set (TWITCH_BOT_USERNAME / TWITCH_OAUTH_TOKEN / " +
        "TWITCH_CHANNEL) — bot offline. Server, overlay and panel still run; " +
        "use the panel's local-test controls until credentials are set."
    );
    return null;
  }

  const client = new tmi.Client({
    options: { debug: false },
    identity: { username, password },
    channels: [channel],
  });

  client.on("message", (_channel, tags, message, self) => {
    if (self) return;
    const name = tags["display-name"] || tags.username || "viewer";
    const text = message.trim();

    if (text === "!quest" || text === "!quests") {
      const quest = board.activeQuest();
      client.say(
        channel,
        quest
          ? `Active quest: ${quest.title} — ${quest.progress}/${quest.goal} (${quest.participants.length} players). Type !join to play!`
          : "No active quest right now. Ask the streamer to start one!"
      );
      return;
    }
    if (text === "!join") {
      const reply = board.handleChat(name, text, countEmotes(tags));
      if (reply) client.say(channel, reply);
      return;
    }
    if (text === "!leaderboard") {
      const top = Object.entries(board.state.leaderboard)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([u, n], i) => `${i + 1}. ${u} (${n})`)
        .join(" | ");
      client.say(channel, top ? `Leaderboard: ${top}` : "No chatters yet!");
      return;
    }
    if (text === "!help") {
      client.say(
        channel,
        "Commands: !quest (current quest), !join (join the quest), !leaderboard, !help"
      );
      return;
    }

    // Every other message still feeds quest progress (chat race / hype).
    board.handleChat(name, text, countEmotes(tags));
  });

  client.connect().catch((err) => {
    console.error("Twitch connect failed:", err);
  });
  return client;
}
