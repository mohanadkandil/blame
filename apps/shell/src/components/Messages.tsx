import { For, Show } from "solid-js";
import { mockMessages } from "../lib/store";
import { ToolBadge } from "./ToolCluster";

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
              <div class="agent-stream">
                {/* Legacy plain-text agent messages */}
                <For each={m.text}>
                  {(p) => <p class="stream-text" innerHTML={formatInline(p)}></p>}
                </For>
                {/* Interleaved blocks: prose + tool rows in order */}
                <Show when={m.blocks}>
                  <For each={m.blocks}>
                    {(b) =>
                      b.kind === "text" ? (
                        <p class="stream-text" innerHTML={formatInline(b.text)}></p>
                      ) : (
                        <ToolBadge tool={b.tool} />
                      )
                    }
                  </For>
                </Show>
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
