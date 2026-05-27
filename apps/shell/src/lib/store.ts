import { createStore } from "solid-js/store";
import { createSignal } from "solid-js";

// ===== Types =====
export type SessionStatus = "running" | "idle" | "completed" | "failed";

export type Session = {
  id: number;
  name: string;
  projectId: string;
  status: SessionStatus;
  branch: string;
  runtime: string;
  tokens: number;
  costUsd: number;
};

export type Project = {
  id: string;
  name: string;
  active: boolean;
  runningCount: number;
  expanded: boolean;
  attention?: boolean;
};

export type ChangedFile = {
  path: string;
  kind: "M" | "A" | "D";
  added?: number;
  removed?: number;
  active?: boolean;
};

export type ToolStatus = "ok" | "err" | "run";
export type ToolDiffLine = { type: "add" | "rem" | "ctx"; num: string; text: string };

export type ToolCall = {
  id: string;
  icon: string;
  name: string;        // e.g. "Run plan-technical"
  provider?: string;   // e.g. "codex" / "claude"
  args: string;        // detail, e.g. "plan-technical" / "12 files changed"
  status: ToolStatus;
  statusLabel: string;
  open: boolean;
  body?: ToolDiffLine[];
};

// Agent stream = ordered interleave of prose + tool calls (Paseo model).
export type Block =
  | { kind: "text"; text: string }
  | { kind: "tool"; tool: ToolCall };

export type Message = {
  id: number;
  role: "user" | "agent";
  who: string;
  model?: string;
  stamp: string;
  text: string[];
  blocks?: Block[];
};

// ===== App state — empty by default. Real data fills as user works. =====
const [state, setState] = createStore({
  sessions: [] as Session[],
  activeSessionId: null as number | null,
  projects: [] as Project[],
  changes: [] as ChangedFile[],
  rightTab:  "changes"  as "all" | "changes" | "checks" | "review" | "history",
  bottomTab: "terminal" as "setup" | "run" | "terminal" | "logs",
  thinkingLevel: 0 as 0 | 1 | 2 | 3,
});

export { state, setState };


// ===== Toast =====
const [toastMsg, setToastMsg] = createSignal<string | null>(null);
let toastTimer: number | undefined;

export function showToast(msg: string) {
  setToastMsg(msg);
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => setToastMsg(null), 2400);
}

export { toastMsg };

// ===== Actions =====
export function switchSession(id: number) { setState("activeSessionId", id); }
export function toggleProject(id: string) {
  setState("projects", (p) => p.id === id, "expanded", (e) => !e);
}
export function sessionsForProject(projectId: string): Session[] {
  return state.sessions.filter((s) => s.projectId === projectId);
}
export function setRightTab(tab: typeof state.rightTab)   { setState("rightTab", tab); }
export function setBottomTab(tab: typeof state.bottomTab) { setState("bottomTab", tab); }

// ===== Live conversation — array of turns that grows across sends =====
import { createStore as createSolidStore } from "solid-js/store";
import { onAgentEvent, spawnAgent } from "./socket";

export type Turn = {
  id: number;
  userText: string;
  agentBlocks: Block[];
  done: boolean;
  runId?: number;
  branch?: string;
  worktreePath?: string;
};

const [conversationState, setConversation] = createSolidStore<{ turns: Turn[] }>({ turns: [] });
export const conversation = () => conversationState.turns;
export const [streaming, setStreaming] = createSignal(false);

function activeTurnIndex(): number {
  // Mutate the most recent turn (the in-flight one).
  return conversationState.turns.length - 1;
}

// Map daemon events -> blocks on the active turn.
onAgentEvent((ev) => {
  const i = activeTurnIndex();
  if (i < 0) return;

  if (ev.type === "text") {
    setConversation("turns", i, "agentBlocks", (bs): Block[] => {
      const last = bs[bs.length - 1];
      if (last && last.kind === "text") {
        return [...bs.slice(0, -1), { kind: "text" as const, text: last.text + ev.text }];
      }
      return [...bs, { kind: "text" as const, text: ev.text }];
    });
  } else if (ev.type === "tool_use") {
    const tool: ToolCall = {
      id: ev.tool_id,
      icon: "bot",
      name: ev.name,
      args:
        typeof ev.input === "object" && ev.input !== null
          ? summariseInput(ev.input as Record<string, unknown>)
          : "",
      status: "run",
      statusLabel: "",
      open: false,
    };
    setConversation("turns", i, "agentBlocks", (bs): Block[] => [...bs, { kind: "tool" as const, tool }]);
  } else if (ev.type === "tool_result") {
    setConversation("turns", i, "agentBlocks", (bs): Block[] =>
      bs.map((b): Block =>
        b.kind === "tool" && b.tool.id === ev.tool_id
          ? {
              kind: "tool" as const,
              tool: {
                ...b.tool,
                status: "ok" as const,
                body: [{ type: "ctx" as const, num: "", text: ev.output.slice(0, 4000) }],
              },
            }
          : b,
      ),
    );
  } else if (ev.type === "done") {
    setConversation("turns", i, "done", true);
    setStreaming(false);
  }
});

function summariseInput(input: Record<string, unknown>): string {
  const v = input.file_path || input.path || input.pattern || input.command || input.url;
  if (typeof v === "string") return v.length > 80 ? v.slice(0, 77) + "…" : v;
  const keys = Object.keys(input);
  return keys.length ? keys.join(", ") : "";
}

export async function sendPrompt(prompt: string) {
  const text = prompt.trim();
  if (!text || streaming()) return;

  // Append a new turn — user msg + empty agent reply.
  const id = Date.now();
  setConversation("turns", (ts) => [
    ...ts,
    { id, userText: text, agentBlocks: [], done: false },
  ]);
  setStreaming(true);

  try {
    const reply = await spawnAgent(text);
    const i = activeTurnIndex();
    setConversation("turns", i, "runId", reply.run_id);
    if (reply.branch) setConversation("turns", i, "branch", reply.branch);
    if (reply.path) setConversation("turns", i, "worktreePath", reply.path);
  } catch (e) {
    setStreaming(false);
    setConversation("turns", activeTurnIndex(), "done", true);
    showToast("Spawn failed: " + (e as Error).message);
  }
}

export function clearConversation() {
  setConversation("turns", []);
}

// ===== Thinking-level (UI control) =====
export const THINKING_LABELS = ["normal", "medium", "high", "max"] as const;
export function cycleThinking() {
  setState("thinkingLevel", ((state.thinkingLevel + 1) % 4) as 0 | 1 | 2 | 3);
}
