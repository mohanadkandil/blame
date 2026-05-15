import { For, Show } from "solid-js";
import { state, switchSession, toggleProject, sessionsForProject, showToast } from "../lib/store";
import { theme, cycleTheme, THEME_LABELS } from "../lib/theme";

export default function Sidebar() {
  return (
    <aside class="sb">
      {/* Header row — sidebar-height action, bottom border (Paseo SidebarHeaderRow) */}
      <button class="sb-head" onClick={() => showToast("New agent (wired in v0.1)")}>
        <svg class="sb-head-ic" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
        <span class="sb-head-label">New agent</span>
        <span class="sb-head-kbd">⌘N</span>
      </button>

      {/* Project tree — unified collapsible projects → agent sessions */}
      <div class="sb-tree">
        <For each={state.projects}>
          {(p) => {
            const sessions = () => sessionsForProject(p.id);
            return (
              <div class="proj">
                <button
                  class={`proj-row${p.active ? " active" : ""}`}
                  onClick={() => toggleProject(p.id)}
                >
                  <svg
                    class={`proj-chevron${p.expanded ? " open" : ""}`}
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                  >
                    <path d="M4.5 3l3 3-3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <span class="proj-name">{p.name}</span>
                  <Show when={p.runningCount > 0}>
                    <span class="proj-count">{p.runningCount}</span>
                  </Show>
                  <Show when={p.attention && p.runningCount === 0}>
                    <span class="proj-dot attention"></span>
                  </Show>
                </button>

                <Show when={p.expanded}>
                  <div class="proj-children">
                    <For each={sessions()}>
                      {(s) => (
                        <button
                          class={`agent-row${s.id === state.activeSessionId ? " active" : ""}`}
                          onClick={() => switchSession(s.id)}
                        >
                          <span class={`agent-dot ${s.status}`}></span>
                          <span class="agent-name">{s.name}</span>
                        </button>
                      )}
                    </For>
                    <Show when={sessions().length === 0}>
                      <div class="proj-empty">No agents</div>
                    </Show>
                  </div>
                </Show>
              </div>
            );
          }}
        </For>
      </div>

      {/* Footer — host pill (left) + icon row (right), top border */}
      <div class="sb-foot">
        <button
          class="host-pill"
          title={`Theme: ${THEME_LABELS[theme()]}`}
          onClick={() => { cycleTheme(); showToast(`Theme · ${THEME_LABELS[theme()]}`); }}
        >
          <span class="host-dot"></span>
          <span class="host-name">local</span>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div class="foot-icons">
          <button class="foot-ic" title="Add project" onClick={() => showToast("Add project")}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3H6l1.5 1.5h5A1.5 1.5 0 0 1 14 6v5.5A1.5 1.5 0 0 1 12.5 13h-9A1.5 1.5 0 0 1 2 11.5v-7Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" />
              <path d="M8 7v3M6.5 8.5h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
            </svg>
          </button>
          <button class="foot-ic" title="Settings" onClick={() => showToast("Settings")}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="2.4" stroke="currentColor" stroke-width="1.4" />
              <path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8L3.4 3.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
