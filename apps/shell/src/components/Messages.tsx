import { For, Show } from "solid-js";
import { mockMessages } from "../lib/store";
import ToolCard from "./ToolCard";

export default function Messages() {
  return (
    <div class="messages">
      <For each={mockMessages}>
        {(m) => (
          <div class={`msg ${m.role}`}>
            <div class="avatar">{m.role === "user" ? "M" : "O"}</div>
            <div class="body">
              <div class="name-row">
                <span class="who"><b>{m.who}</b></span>
                <Show when={m.model}>
                  <span class="model">{m.model}</span>
                </Show>
                <span class="stamp">{m.stamp}</span>
              </div>
              <div class="text">
                <For each={m.text}>
                  {(p) => <p innerHTML={formatInline(p)}></p>}
                </For>
              </div>
              <Show when={m.tools}>
                <For each={m.tools}>
                  {(t) => <ToolCard tool={t} />}
                </For>
              </Show>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}

// Format inline `code` → <code>…</code>. Safe-ish for mock data only.
function formatInline(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/`([^`]+)`/g, "<code>$1</code>");
}
