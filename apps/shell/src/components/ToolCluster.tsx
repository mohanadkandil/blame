import { For, Show, createSignal } from "solid-js";
import type { ToolCall } from "../lib/store";

// Paseo ExpandableBadge — bot icon + name + (provider · detail) + trailing
// status glyph (✓ done / spinner running). No bg. Expand → surface-1 + detail.
export function ToolBadge(props: { tool: ToolCall }) {
  const [open, setOpen] = createSignal(false);
  const t = props.tool;
  const hasBody = () => !!t.body && t.body.length > 0;

  return (
    <div class={`tbadge${open() ? " open" : ""}${t.status === "err" ? " err" : ""}${hasBody() ? " expandable" : ""}`}>
      <button class="tbadge-row" onClick={() => hasBody() && setOpen(!open())}>
        <span class="tbadge-ic">
          <svg class="gi" width="17" height="17" viewBox="0 0 18 18" fill="none">
            <rect x="3" y="6" width="12" height="9" rx="2.2" stroke="currentColor" stroke-width="1.4" />
            <path d="M9 3.2v2.8M6.5 10h.01M11.5 10h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            <circle cx="9" cy="2.6" r="1" fill="currentColor" />
          </svg>
          <Show when={hasBody()}>
            <svg class={`ch${open() ? " open" : ""}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4.5 3l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </Show>
        </span>

        <span class="tbadge-name">{t.name}</span>
        <Show when={t.provider || t.args}>
          <span class="tbadge-secondary">
            <Show when={t.provider}><span class="tb-prov">{t.provider}</span></Show>
            <Show when={t.provider && t.args}><span class="tb-sep">·</span></Show>
            <Show when={t.args}><span>{t.args}</span></Show>
          </span>
        </Show>

        <span class="tbadge-spacer"></span>

        <span class={`tbadge-state s-${t.status}`}>
          <Show when={t.status === "ok"}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7.5l2.5 2.5L11 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </Show>
          <Show when={t.status === "run"}>
            <svg class="spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5a5.5 5.5 0 1 1-5.5 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </Show>
          <Show when={t.status === "err"}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 4v3.5M7 10h.01M7 1.5L1 11.5h12L7 1.5Z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </Show>
        </span>
      </button>

      <Show when={open() && hasBody()}>
        <div class="tbadge-detail">
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
    </div>
  );
}

export default function ToolCluster(props: { tools: ToolCall[]; messageCount?: number }) {
  return (
    <div class="tcalls">
      <For each={props.tools}>{(t) => <ToolBadge tool={t} />}</For>
    </div>
  );
}
