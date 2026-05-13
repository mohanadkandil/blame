import { For } from "solid-js";
import { state, switchSession, showToast } from "../lib/store";

export default function Sidebar() {
  return (
    <aside class="sb">
      <div class="sb-search">
        <span class="ic">⌕</span>
        <input type="text" placeholder="Search…" />
        <span class="kbd">⌘K</span>
      </div>

      <div class="sb-scroll">
        <div class="sb-sect">
          <div class="lbl">
            Workspace
            <button class="plus" onClick={() => showToast("Add project (wired in v0.1)")}>+</button>
          </div>
          <For each={state.projects}>
            {(p) => (
              <button class={`sb-item${p.active ? " active" : ""}`}>
                <span class="ic">▸</span>
                <span class="label">{p.name}</span>
                <span class={`dot${p.runningCount > 0 ? " running" : p.attention ? " attention" : ""}`}></span>
                <span class="count">{p.runningCount}</span>
              </button>
            )}
          </For>
        </div>

        <div class="sb-sect">
          <div class="lbl">
            Sessions
            <button class="plus" onClick={() => showToast("New session (wired in v0.1)")}>+</button>
          </div>
          <For each={state.sessions}>
            {(s) => (
              <button
                class={`sb-item${s.id === state.activeSessionId ? " active" : ""}`}
                onClick={() => switchSession(s.id)}
              >
                <span class="ic">●</span>
                <span class="label">{s.name}</span>
              </button>
            )}
          </For>
        </div>

        <div class="sb-sect">
          <div class="lbl">Views</div>
          <button class="sb-item"><span class="ic">▤</span><span class="label">All sessions</span><span class="count">312</span></button>
          <button class="sb-item"><span class="ic">⏱</span><span class="label">Recent</span></button>
          <button class="sb-item"><span class="ic">⚑</span><span class="label">Needs review</span><span class="count">2</span></button>
          <button class="sb-item"><span class="ic">$</span><span class="label">Costs</span></button>
        </div>
      </div>

      <div class="sb-bottom">
        <button class="sb-cog" title="Settings" onClick={() => showToast("Opened settings")}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2.4" stroke="currentColor" stroke-width="1.4"/>
            <path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8L3.4 3.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}
