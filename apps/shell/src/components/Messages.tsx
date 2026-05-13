import { For, Show } from "solid-js";
import { mockMessages } from "../lib/store";
import ToolCluster from "./ToolCluster";

export default function Messages() {
  return (
    <div class="messages">
      <For each={mockMessages}>
        {(m) => (
          <div class={`msg ${m.role}`}>
            <Show when={m.role === "user"}>
              <div class="user-bubble">
                <For each={m.text}>
                  {(p) => <p innerHTML={formatInline(p)}></p>}
                </For>
              </div>
            </Show>
            <Show when={m.role === "agent"}>
              <Show when={m.tools && m.tools.length > 0}>
                <ToolCluster tools={m.tools!} messageCount={m.text.length} />
              </Show>
              <div class="agent-prose">
                <For each={m.text}>
                  {(p) => <p innerHTML={formatInline(p)}></p>}
                </For>
              </div>
            </Show>
          </div>
        )}
      </For>
    </div>
  );
}

function formatInline(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/`([^`]+)`/g, "<code>$1</code>");
}
