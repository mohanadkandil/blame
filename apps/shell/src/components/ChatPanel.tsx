import { For, createSignal } from "solid-js";
import { state, switchSession, showToast, cycleThinking, THINKING_LABELS } from "../lib/store";
import Messages from "./Messages";

export default function ChatPanel() {
  const [text, setText] = createSignal("");

  const activeSession = () => state.sessions.find((s) => s.id === state.activeSessionId);
  // Deck tabs = agents in the active session's project (Paseo workspace deck model)
  const deckTabs = () => {
    const pid = activeSession()?.projectId;
    return pid ? state.sessions.filter((s) => s.projectId === pid) : state.sessions;
  };

  function onKey(e: KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      const t = text().trim();
      if (!t) return;
      showToast(`Spawned: ${t.slice(0, 40)}…`);
      setText("");
    }
  }

  return (
    <main class="chat">
      {/* Tabs */}
      <div class="chat-tabs">
        <For each={deckTabs()}>
          {(s) => (
            <button
              class={`chat-tab${s.id === state.activeSessionId ? " active" : ""}`}
              onClick={() => switchSession(s.id)}
            >
              <span class={`dot${s.status === "running" ? " running" : ""}`}></span>
              <span>{s.name}</span>
              <span class="x">×</span>
            </button>
          )}
        </For>
        <button class="chat-tab new" onClick={() => showToast("New session (wired in v0.1)")}>+</button>
      </div>

      {/* Toolbar */}
      <div class="chat-toolbar">
        <div class="branch">
          <span class="ico">⎇</span>
          <span><b>{activeSession()?.branch}</b> · off main</span>
        </div>
        <div class="meta">
          runtime <b>{activeSession()?.runtime}</b> · tokens <b>{activeSession()?.tokens.toLocaleString()}</b> · <b>${activeSession()?.costUsd.toFixed(2)}</b>
        </div>
      </div>

      {/* Messages */}
      <Messages />

      {/* Composer */}
      <div class="composer">
        <div class="ip">
          <textarea
            rows="1"
            placeholder="Ask, paste a goal, @-mention a file, or /run a command…"
            value={text()}
            onInput={(e) => setText(e.currentTarget.value)}
            onKeyDown={onKey}
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck={false}
          />
          <div class="bar">
            <button class="chip">
              <img src="/claude-ai-icon.svg" class="brand-icon" alt="Claude" />
              <b>Opus 4.7</b>
              <span class="ctx-badge">1M</span>
              <span class="arrow">▾</span>
            </button>
            <button
              class={`chip brain level-${state.thinkingLevel}`}
              onClick={() => cycleThinking()}
              title="Thinking level — click to cycle"
            >
              <span class="brain-ic"><span class="brain-fill"></span></span>
              <b>{THINKING_LABELS[state.thinkingLevel]}</b>
            </button>
            <div class="right">
              <button class="icon-btn" title="Attach file or screenshot">
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </button>
              <button
                class="send"
                onClick={() => {
                  const t = text().trim();
                  if (!t) return;
                  showToast(`Spawned: ${t.slice(0, 40)}…`);
                  setText("");
                }}
                disabled={!text().trim()}
                title="Send (⌘↵)"
              >
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 13V3M8 3L3.5 7.5M8 3l4.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
