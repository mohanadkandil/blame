import { For } from "solid-js";
import { state, switchSession, showToast } from "../lib/store";

export default function Sidebar() {
  return (
    <aside class="sb">
      <div class="sb-top">
        <div class="logo">C</div>
        <div class="name">Cadence</div>
        <div class="org">Mohanad</div>
      </div>

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
        <div class="health"><span class="ok">●</span> brain healthy · 4ms · 38MB</div>
      </div>
    </aside>
  );
}
