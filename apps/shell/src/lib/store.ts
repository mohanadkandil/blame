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

// ===== Mock state — Paseo-style: projects own their agent sessions =====
const [state, setState] = createStore({
  sessions: [
    { id: 0, name: "agent comms layer",      projectId: "foo",           status: "running" as SessionStatus,   branch: "cadence/agent-comms",      runtime: "1m 24s", tokens: 4128,  costUsd: 0.34 },
    { id: 1, name: "refactor stream handler",projectId: "foo",           status: "running" as SessionStatus,   branch: "cadence/refactor-stream",  runtime: "0m 42s", tokens: 2018,  costUsd: 0.14 },
    { id: 2, name: "webhook idempotency",    projectId: "foo",           status: "completed" as SessionStatus, branch: "cadence/webhook-fix",      runtime: "2m 07s", tokens: 7219,  costUsd: 1.04 },
    { id: 3, name: "input validation",       projectId: "webapp",        status: "idle" as SessionStatus,      branch: "cadence/input-validation", runtime: "1m 17s", tokens: 11623, costUsd: 0.91 },
    { id: 4, name: "oauth 2.1 migration",    projectId: "webapp",        status: "running" as SessionStatus,   branch: "cadence/oauth",            runtime: "0m 31s", tokens: 1820,  costUsd: 0.09 },
    { id: 5, name: "rename design tokens",   projectId: "design-system", status: "completed" as SessionStatus, branch: "cadence/tokens",           runtime: "3m 02s", tokens: 5410,  costUsd: 0.62 },
  ] as Session[],
  activeSessionId: 0,
  projects: [
    { id: "foo",           name: "foo",           active: true,  runningCount: 2, expanded: true },
    { id: "webapp",        name: "webapp",        active: false, runningCount: 1, expanded: true },
    { id: "infra",         name: "infra",         active: false, runningCount: 0, expanded: false },
    { id: "design-system", name: "design-system", active: false, runningCount: 0, expanded: false, attention: true },
  ] as Project[],
  changes: [
    { path: "lib/foo_web/sse.ex",         kind: "M", added: 62, removed: 18, active: true },
    { path: "test/foo_web/sse_test.exs",  kind: "A", added: 34 },
    { path: "lib/foo_web/router.ex",      kind: "M", added: 2,  removed: 1 },
    { path: "docs/architecture.md",       kind: "M", added: 6 },
  ] as ChangedFile[],
  rightTab:  "changes"  as "all" | "changes" | "checks" | "review" | "history",
  bottomTab: "terminal" as "setup" | "run" | "terminal" | "logs",
  thinkingLevel: 0 as 0 | 1 | 2 | 3,
});

export { state, setState };

// ===== Mock messages — interleaved stream (Paseo orchestration model) =====
export const mockMessages: Message[] = [
  {
    id: 1,
    role: "user",
    who: "You",
    stamp: "15:40:02",
    text: [
      "Plan and build the analytics dashboard. Use Codex for implementation, Claude for design and review.",
    ],
  },
  {
    id: 2,
    role: "agent",
    who: "Opus 4.7",
    model: "claude-opus-4-7",
    stamp: "15:40:06",
    text: [],
    blocks: [
      { kind: "text", text: "I'll break this down into planning and implementation." },
      {
        kind: "tool",
        tool: {
          id: "t1", icon: "bot", name: "Run plan-technical",
          provider: "codex", args: "plan-technical",
          status: "ok", statusLabel: "", open: false,
          body: [
            { type: "ctx", num: "1", text: "# Technical plan" },
            { type: "ctx", num: "2", text: "- SSE endpoint + reducer" },
            { type: "ctx", num: "3", text: "- token meter component" },
            { type: "ctx", num: "…", text: "42 more lines" },
          ],
        },
      },
      {
        kind: "tool",
        tool: {
          id: "t2", icon: "bot", name: "Run plan-design",
          provider: "claude", args: "plan-design",
          status: "ok", statusLabel: "", open: false,
        },
      },
      {
        kind: "tool",
        tool: {
          id: "t3", icon: "bot", name: "Wait for agents",
          provider: "", args: "plan-technical  plan-design",
          status: "ok", statusLabel: "", open: false,
        },
      },
      { kind: "text", text: "Got the plans. Spinning up Codex for implementation." },
      {
        kind: "tool",
        tool: {
          id: "t4", icon: "bot", name: "Run implement",
          provider: "codex", args: "12 files changed",
          status: "ok", statusLabel: "", open: true,
          body: [
            { type: "add", num: "+", text: "lib/dash/live.ex" },
            { type: "add", num: "+", text: "lib/dash_web/components/meter.ex" },
            { type: "add", num: "+", text: "test/dash/live_test.exs" },
            { type: "ctx", num: "…", text: "9 more files" },
          ],
        },
      },
      { kind: "text", text: "Implementation done. Requesting review from Claude." },
      {
        kind: "tool",
        tool: {
          id: "t5", icon: "bot", name: "Run review",
          provider: "claude", args: "no issues found",
          status: "run", statusLabel: "", open: false,
        },
      },
      { kind: "text", text: "All tasks complete. Dashboard is ready." },
    ],
  },
];

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
    await spawnAgent(text);
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
