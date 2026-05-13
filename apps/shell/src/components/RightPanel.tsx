import { For } from "solid-js";
import { state, setRightTab, setBottomTab } from "../lib/store";

export default function RightPanel() {
  return (
    <aside class="right">
      <div class="tabs-1">
        <button class={`tab1${state.rightTab === "all" ? " active" : ""}`} onClick={() => setRightTab("all")}>All files</button>
        <button class={`tab1${state.rightTab === "changes" ? " active" : ""}`} onClick={() => setRightTab("changes")}>
          Changes <span class="count">{state.changes.length}</span>
        </button>
        <button class={`tab1${state.rightTab === "checks" ? " active" : ""}`} onClick={() => setRightTab("checks")}>
          Checks <span class="count">2</span>
        </button>
        <button class={`tab1${state.rightTab === "review" ? " active" : ""}`} onClick={() => setRightTab("review")}>Review</button>
        <button class={`tab1${state.rightTab === "history" ? " active" : ""}`} onClick={() => setRightTab("history")}>History</button>
      </div>

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

      <div class="tabs-2">
        <button class={`tab2${state.bottomTab === "setup" ? " active" : ""}`} onClick={() => setBottomTab("setup")}>Setup</button>
        <button class={`tab2${state.bottomTab === "run" ? " active" : ""}`} onClick={() => setBottomTab("run")}>Run</button>
        <button class={`tab2${state.bottomTab === "terminal" ? " active" : ""}`} onClick={() => setBottomTab("terminal")}>Terminal</button>
        <button class={`tab2${state.bottomTab === "logs" ? " active" : ""}`} onClick={() => setBottomTab("logs")}>Logs</button>
      </div>

      <div class="terminal">
        <div class="ln"><span class="p">~/foo</span> <span class="grey">main</span> $ mix test test/foo_web/sse_test.exs</div>
        <div class="ln"><span class="grey">Compiling 2 files (.ex)</span></div>
        <div class="ln"><span class="grey">...</span></div>
        <div class="ln"></div>
        <div class="ln"><span class="ok">Finished in 0.4 seconds (0.2s async, 0.2s sync)</span></div>
        <div class="ln"><span class="ok">3 tests, 0 failures</span></div>
        <div class="ln"></div>
        <div class="ln"><span class="p">~/foo</span> <span class="grey">main</span> $ git diff --stat</div>
        <div class="ln"> lib/foo_web/sse.ex            | 80 ++++++++++--−</div>
        <div class="ln"> lib/foo_web/router.ex         |  3 +−</div>
        <div class="ln"> test/foo_web/sse_test.exs     | 34 ++++++++</div>
        <div class="ln"> docs/architecture.md          |  6 ++</div>
        <div class="ln"> 4 files changed, 102 insertions(+), 19 deletions(-)</div>
        <div class="ln"></div>
        <div class="ln"><span class="p">~/foo</span> <span class="grey">main</span> $ <span class="cursor"></span></div>
      </div>
    </aside>
  );
}
