import { createStore } from "solid-js/store";
import { createSignal } from "solid-js";

// ===== Types =====
export type SessionStatus = "running" | "idle" | "completed" | "failed";

export type Session = {
  id: number;
  name: string;
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
  name: string;
  args: string;
  status: ToolStatus;
  statusLabel: string;
  open: boolean;
  body?: ToolDiffLine[];
};

export type Message = {
  id: number;
  role: "user" | "agent";
  who: string;
  model?: string;
  stamp: string;
  text: string[];
  tools?: ToolCall[];
};

// ===== Mock state =====
const [state, setState] = createStore({
  sessions: [
    { id: 0, name: "agent comms layer",      status: "running" as SessionStatus,   branch: "cadence/agent-comms",      runtime: "1m 24s", tokens: 4128,  costUsd: 0.34 },
    { id: 1, name: "refactor stream handler",status: "running" as SessionStatus,   branch: "cadence/refactor-stream",  runtime: "0m 42s", tokens: 2018,  costUsd: 0.14 },
    { id: 2, name: "webhook idempotency",    status: "completed" as SessionStatus, branch: "cadence/webhook-fix",      runtime: "2m 07s", tokens: 7219,  costUsd: 1.04 },
    { id: 3, name: "add input validation",   status: "idle" as SessionStatus,      branch: "cadence/input-validation", runtime: "1m 17s", tokens: 11623, costUsd: 0.91 },
  ] as Session[],
  activeSessionId: 0,
  projects: [
    { id: "foo",           name: "foo",           active: true,  runningCount: 3 },
    { id: "webapp",        name: "webapp",        active: false, runningCount: 0 },
    { id: "infra",         name: "infra",         active: false, runningCount: 0 },
    { id: "design-system", name: "design-system", active: false, runningCount: 1, attention: true },
  ] as Project[],
  changes: [
    { path: "lib/foo_web/sse.ex",         kind: "M", added: 62, removed: 18, active: true },
    { path: "test/foo_web/sse_test.exs",  kind: "A", added: 34 },
    { path: "lib/foo_web/router.ex",      kind: "M", added: 2,  removed: 1 },
    { path: "docs/architecture.md",       kind: "M", added: 6 },
  ] as ChangedFile[],
  rightTab:  "changes"  as "all" | "changes" | "checks" | "review" | "history",
  bottomTab: "terminal" as "setup" | "run" | "terminal" | "logs",
});

export { state, setState };

// ===== Mock messages =====
export const mockMessages: Message[] = [
  {
    id: 1,
    role: "user",
    who: "You",
    stamp: "10:42:18",
    text: [
      "Refactor the streaming response handler in `lib/foo_web/sse.ex` to use Server-Sent Events instead of long polling. Keep the public API stable. Add tests for the new path.",
    ],
  },
  {
    id: 2,
    role: "agent",
    who: "Opus 4.7",
    model: "claude-opus-4-7",
    stamp: "10:42:23",
    text: ["I'll read the existing handler, identify the long-polling sites, refactor to SSE, then add tests. The public function signature stays."],
    tools: [
      {
        id: "t1",
        icon: "R",
        name: "read_file",
        args: "path: lib/foo_web/sse.ex",
        status: "ok",
        statusLabel: "✓ 124 LOC",
        open: true,
        body: [
          { type: "ctx", num: "1", text: "defmodule FooWeb.SSE do" },
          { type: "ctx", num: "2", text: "  use FooWeb, :controller" },
          { type: "ctx", num: "3", text: "" },
          { type: "ctx", num: "4", text: "  def stream(conn, _params) do" },
          { type: "ctx", num: "5", text: "    conn |> long_poll_loop()" },
          { type: "ctx", num: "6", text: "  end" },
          { type: "ctx", num: "…", text: "119 more lines" },
        ],
      },
      {
        id: "t2",
        icon: "S",
        name: "grep",
        args: "pattern: long_poll · in: lib/**/*.ex",
        status: "ok",
        statusLabel: "✓ 3 matches",
        open: false,
      },
      {
        id: "t3",
        icon: "W",
        name: "write_file",
        args: "path: lib/foo_web/sse.ex · +62 −18",
        status: "run",
        statusLabel: "● writing",
        open: true,
        body: [
          { type: "add", num: "+", text: "  def stream(conn, _params) do" },
          { type: "add", num: "+", text: "    conn" },
          { type: "add", num: "+", text: "    |> put_resp_header(\"content-type\", \"text/event-stream\")" },
          { type: "add", num: "+", text: "    |> send_chunked(200)" },
          { type: "add", num: "+", text: "    |> sse_loop()" },
          { type: "add", num: "+", text: "  end" },
          { type: "rem", num: "−", text: "  def stream(conn, _params) do" },
          { type: "rem", num: "−", text: "    conn |> long_poll_loop()" },
          { type: "rem", num: "−", text: "  end" },
        ],
      },
      {
        id: "t4",
        icon: "T",
        name: "run_tests",
        args: "filter: test/foo_web/sse_test.exs",
        status: "run",
        statusLabel: "● in progress",
        open: false,
      },
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
export function setRightTab(tab: typeof state.rightTab)   { setState("rightTab", tab); }
export function setBottomTab(tab: typeof state.bottomTab) { setState("bottomTab", tab); }
