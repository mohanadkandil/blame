import { Socket, Channel } from "phoenix";

// Phoenix WebSocket — one connection, one "agents" channel.
const socket = new Socket("ws://localhost:4000/socket", {});
socket.connect();

const channel: Channel = socket.channel("agents", {});
channel
  .join()
  .receive("ok", () => console.log("[socket] joined agents"))
  .receive("error", (e) => console.error("[socket] join failed", e));

export type AgentEvent =
  | { type: "text"; text: string }
  | { type: "tool_use"; tool_id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_id: string; output: string }
  | { type: "result"; result: string; cost_usd?: number; duration_ms?: number }
  | { type: "done"; exit_status: number };

const eventListeners: Array<(ev: AgentEvent) => void> = [];

channel.on("agent_event", (ev: AgentEvent) => {
  for (const cb of eventListeners) cb(ev);
});

export type SpawnReply = {
  run_id: number;
  isolated: boolean;
  branch?: string;
  path?: string;
};

export function spawnAgent(
  prompt: string,
  opts: { isolate?: boolean } = {},
): Promise<SpawnReply> {
  const isolate = opts.isolate ?? true;
  return new Promise((resolve, reject) => {
    channel
      .push("spawn", { prompt, isolate })
      .receive("ok", (resp: SpawnReply) => resolve(resp))
      .receive("error", reject)
      .receive("timeout", () => reject(new Error("spawn timeout")));
  });
}

export function onAgentEvent(cb: (ev: AgentEvent) => void): () => void {
  eventListeners.push(cb);
  return () => {
    const i = eventListeners.indexOf(cb);
    if (i >= 0) eventListeners.splice(i, 1);
  };
}
