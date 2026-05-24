import { For, Show } from "solid-js";
import { mockMessages, conversation, streaming } from "../lib/store";
import { ToolBadge } from "./ToolCluster";

export default function Messages() {
  const hasLive = () => conversation().length > 0;

  return (
    <div class="messages">
      <Show
        when={hasLive()}
        fallback={
          <For each={mockMessages}>
            {(m) => (
              <div class={`msg ${m.role}`}>
                <Show when={m.role === "user"}>
                  <div class="user-bubble">
                    <For each={m.text}>{(p) => <p innerHTML={formatInline(p)}></p>}</For>
                  </div>
                </Show>
                <Show when={m.role === "agent"}>
                  <div class="agent-stream">
                    <For each={m.text}>{(p) => <p class="stream-text" innerHTML={formatInline(p)}></p>}</For>
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
        }
      >
        {/* Live conversation — array of turns */}
        <For each={conversation()}>
          {(turn, i) => (
            <>
              <div class="msg user">
                <div class="user-bubble">
                  <p innerHTML={formatInline(turn.userText)}></p>
                </div>
              </div>
              <div class="msg agent">
                <div class="agent-stream">
                  <For each={turn.agentBlocks}>
                    {(b) =>
                      b.kind === "text" ? (
                        <p class="stream-text" innerHTML={formatInline(b.text)}></p>
                      ) : (
                        <ToolBadge tool={b.tool} />
                      )
                    }
                  </For>
                  <Show when={!turn.done && streaming() && i() === conversation().length - 1}>
                    <p class="stream-text typing">…</p>
                  </Show>
                </div>
              </div>
            </>
          )}
        </For>
      </Show>
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
