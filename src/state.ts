import * as fs from "fs";
import * as path from "path";

export type QuestType = "chat-race" | "newcomer-welcome" | "hype-meter";

export interface Quest {
  id: string;
  type: QuestType;
  title: string;
  goal: number;
  progress: number;
  status: "active" | "completed";
  participants: string[];
}

export interface BoardState {
  quests: Quest[];
  leaderboard: Record<string, number>;
  seenChatters: string[];
  events: string[];
}

const STATE_FILE = path.join(__dirname, "..", "state.json");

export const QUEST_TITLES: Record<QuestType, string> = {
  "chat-race": "Chat Race",
  "newcomer-welcome": "Welcome Wagon",
  "hype-meter": "Hype Meter",
};

export function defaultState(): BoardState {
  return { quests: [], leaderboard: {}, seenChatters: [], events: [] };
}

export function loadState(): BoardState {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    const parsed = JSON.parse(raw) as BoardState;
    if (parsed && Array.isArray(parsed.quests)) return parsed;
  } catch {
    // No saved state yet — start fresh.
  }
  return defaultState();
}

export function saveState(state: BoardState): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export class Board {
  state: BoardState;

  constructor() {
    this.state = loadState();
  }

  private persist(): void {
    saveState(this.state);
  }

  log(message: string): void {
    const line = `${new Date().toISOString()} ${message}`;
    this.state.events.unshift(line);
    this.state.events = this.state.events.slice(0, 100);
    console.log(line);
    this.persist();
  }

  activeQuest(): Quest | undefined {
    return this.state.quests.find((q) => q.status === "active");
  }

  startQuest(type: QuestType, goal: number): Quest {
    for (const q of this.state.quests) q.status = "completed";
    const quest: Quest = {
      id: `${Date.now()}`,
      type,
      title: QUEST_TITLES[type],
      goal,
      progress: 0,
      status: "active",
      participants: [],
    };
    this.state.quests.push(quest);
    this.log(`Quest started: ${quest.title} (goal ${goal})`);
    return quest;
  }

  completeQuest(): Quest | undefined {
    const quest = this.activeQuest();
    if (!quest) return undefined;
    quest.status = "completed";
    quest.progress = quest.goal;
    this.log(`Quest completed: ${quest.title}`);
    return quest;
  }

  reset(): void {
    this.state = defaultState();
    this.log("Board reset");
  }

  /** Feed one chat message into the active quest. Returns a reply or null. */
  handleChat(username: string, message: string, emoteCount: number): string | null {
    const user = username.toLowerCase();
    const isFirstTime = !this.state.seenChatters.includes(user);
    if (isFirstTime) this.state.seenChatters.push(user);
    this.state.leaderboard[user] = (this.state.leaderboard[user] || 0) + 1;

    const quest = this.activeQuest();
    if (!quest) {
      this.persist();
      return null;
    }

    let joined = false;
    if (!quest.participants.includes(user)) {
      quest.participants.push(user);
      joined = true;
    }

    if (quest.type === "chat-race") {
      quest.progress += 1;
    } else if (quest.type === "newcomer-welcome" && isFirstTime) {
      quest.progress += 1;
    } else if (quest.type === "hype-meter") {
      quest.progress += emoteCount;
    }

    if (quest.progress >= quest.goal) {
      quest.status = "completed";
      quest.progress = quest.goal;
      this.log(
        `Quest completed: ${quest.title} — ${quest.participants.length} players`
      );
      this.persist();
      return `Quest complete! ${quest.title} finished by ${quest.participants.length} players.`;
    }
    this.persist();
    return joined ? `${username} joined ${quest.title}!` : null;
  }
}
