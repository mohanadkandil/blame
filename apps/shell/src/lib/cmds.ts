import { showToast } from "./store";

export type CmdAction = {
  ic: string;
  name: string;
  desc: string;
  shortcut: string[];
  run: () => void;
};

export const cmdActions: CmdAction[] = [
  {
    ic: "S",
    name: "Spawn run",
    desc: "Use current input as goal · Opus 4.7 · main",
    shortcut: ["↵"],
    run: () => showToast("Spawned run · r_105"),
  },
  {
    ic: "M",
    name: "Merge latest run",
    desc: "r_103 · 4 files · ready",
    shortcut: ["⌘", "M"],
    run: () => showToast("Merged r_103 into main"),
  },
  {
    ic: "D",
    name: "Discard latest run",
    desc: "Keeps worktree for 1h",
    shortcut: ["⌘", "D"],
    run: () => showToast("Discarded run"),
  },
  {
    ic: "C",
    name: "Cancel running agent",
    desc: "Sends SIGTERM · cleans worktree",
    shortcut: ["⌘", "⇧", "C"],
    run: () => showToast("Run cancelled"),
  },
  {
    ic: "O",
    name: "Open file in changes",
    desc: "Jump to diff view",
    shortcut: ["⌘", "O"],
    run: () => showToast("Opened lib/foo_web/sse.ex"),
  },
  {
    ic: "B",
    name: "Switch to project · webapp",
    desc: "No running agents · 14 sessions",
    shortcut: [],
    run: () => showToast("Switched to webapp"),
  },
  {
    ic: "P",
    name: "Create PR from current run",
    desc: "Branch: cadence/agent-comms → main",
    shortcut: ["⌘", "⇧", "P"],
    run: () => showToast("PR created · #142"),
  },
  {
    ic: "?",
    name: "Predict cost · runtime",
    desc: "Pre-flight estimate for current input",
    shortcut: ["⌘", "?"],
    run: () => showToast("Est. $0.40 · 1m 30s · confidence high"),
  },
];
