import { For, Show, createSignal } from "solid-js";
import type { ToolCall } from "../lib/store";

export default function ToolCluster(props: { tools: ToolCall[]; messageCount?: number }) {
  const [open, setOpen] = createSignal(true);
  const [expandedId, setExpandedId] = createSignal<string | null>(props.tools[0]?.id ?? null);

  return (
    <div class={`tool-cluster${open() ? " open" : ""}`}>
      <button class="cluster-summary" onClick={() => setOpen(!open())}>
        <span class="caret">▶</span>
        <span class="counts">
          <b>{props.tools.length}</b>
          <em>tool {props.tools.length === 1 ? "call" : "calls"}</em>
          {props.messageCount !== undefined && (
            <>
              <span class="sep">·</span>
              <b>{props.messageCount}</b>
              <em>{props.messageCount === 1 ? "message" : "messages"}</em>
            </>
          )}
        </span>
      </button>

      <Show when={open()}>
        <div class="cluster-list">
          <For each={props.tools}>
            {(t) => {
              const isOpen = () => expandedId() === t.id;
              return (
                <>
                  <button
                    class={`tool-row${isOpen() ? " expanded" : ""}`}
                    onClick={() => setExpandedId(isOpen() ? null : t.id)}
                  >
                    <span class={`row-dot ${t.status}`}></span>
                    <span class="row-icon">{t.icon}</span>
                    <span class="row-name">{t.name}</span>
                    <span class="row-args">{t.args}</span>
                    <span class={`row-status ${t.status}`}>{t.statusLabel}</span>
                  </button>
                  <Show when={isOpen() && t.body}>
                    <div class="row-body">
                      <For each={t.body}>
                        {(ln) => (
                          <div class={`ln${ln.type === "add" ? " add" : ln.type === "rem" ? " rem" : ""}`}>
                            <span class="num">{ln.num}</span>
                            <span>{ln.text}</span>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
                </>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
}
