import { createSignal, For, Show } from "solid-js";
import type { ToolCall } from "../lib/store";

export default function ToolCard(props: { tool: ToolCall }) {
  const [open, setOpen] = createSignal(props.tool.open);
  return (
    <div class={`tool${open() ? " open" : ""}`}>
      <div class="hdr" onClick={() => setOpen(!open())}>
        <span class="caret">▶</span>
        <span class="ic">{props.tool.icon}</span>
        <span class="name">{props.tool.name}</span>
        <span class="args">{props.tool.args}</span>
        <span class={`status ${props.tool.status}`}>{props.tool.statusLabel}</span>
      </div>
      <Show when={open() && props.tool.body}>
        <div class="body">
          <For each={props.tool.body}>
            {(ln) => (
              <div class={`ln${ln.type === "add" ? " add" : ln.type === "rem" ? " rem" : ""}`}>
                <span class="num">{ln.num}</span>
                <span>{ln.text}</span>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
