import { For, Show } from "solid-js";
import { state, setRightTab, setBottomTab } from "../lib/store";

export default function RightPanel() {
  return (
    <aside class="right">
      <div class="tabs-1">
        <button class={`tab1${state.rightTab === "all" ? " active" : ""}`} onClick={() => setRightTab("all")}>All files</button>
        <button class={`tab1${state.rightTab === "changes" ? " active" : ""}`} onClick={() => setRightTab("changes")}>
          Changes <Show when={state.changes.length > 0}><span class="count">{state.changes.length}</span></Show>
        </button>
        <button class={`tab1${state.rightTab === "checks" ? " active" : ""}`} onClick={() => setRightTab("checks")}>Checks</button>
        <button class={`tab1${state.rightTab === "review" ? " active" : ""}`} onClick={() => setRightTab("review")}>Review</button>
        <button class={`tab1${state.rightTab === "history" ? " active" : ""}`} onClick={() => setRightTab("history")}>History</button>
      </div>

      <Show
        when={state.changes.length > 0}
        fallback={<div class="panel-empty">No changes yet</div>}
      >
        <div class="changes">
          <For each={state.changes}>
            {(c) => (
              <button class={`ch-item${c.active ? " active" : ""}`}>
                <span class={`ic ${c.kind}`}>{c.kind}</span>
                <span class="name">{c.path}</span>
                <span class="stat">
                  {c.added !== undefined && <span class="plus">+{c.added}</span>}
                  {c.removed !== undefined && <> <span class="minus">−{c.removed}</span></>}
                </span>
              </button>
            )}
          </For>
        </div>
      </Show>

      <div class="tabs-2">
        <button class={`tab2${state.bottomTab === "setup" ? " active" : ""}`} onClick={() => setBottomTab("setup")}>Setup</button>
        <button class={`tab2${state.bottomTab === "run" ? " active" : ""}`} onClick={() => setBottomTab("run")}>Run</button>
        <button class={`tab2${state.bottomTab === "terminal" ? " active" : ""}`} onClick={() => setBottomTab("terminal")}>Terminal</button>
        <button class={`tab2${state.bottomTab === "logs" ? " active" : ""}`} onClick={() => setBottomTab("logs")}>Logs</button>
      </div>

      <div class="terminal">
        <div class="ln"><span class="grey">terminal idle —</span> spawn a run to populate</div>
        <div class="ln"></div>
        <div class="ln"><span class="cursor"></span></div>
      </div>
    </aside>
  );
}
