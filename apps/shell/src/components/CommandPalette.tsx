import { createSignal, For, Show, onMount, onCleanup } from "solid-js";
import { cmdActions, type CmdAction } from "../lib/cmds";

export default function CommandPalette() {
  const [open, setOpen] = createSignal(false);
  const [query, setQuery] = createSignal("");
  const [sel, setSel] = createSignal(0);

  let inputEl!: HTMLInputElement;

  const filtered = (): CmdAction[] => {
    const q = query().toLowerCase();
    if (!q) return cmdActions;
    return cmdActions.filter((a) => (a.name + " " + a.desc).toLowerCase().includes(q));
  };

  function openPalette() {
    setOpen(true);
    setQuery("");
    setSel(0);
    queueMicrotask(() => inputEl?.focus());
  }
  function close() { setOpen(false); }

  function onKey(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openPalette();
      return;
    }
    if (e.key === "Escape" && open()) {
      e.preventDefault();
      close();
    }
  }

  onMount(() => {
    window.addEventListener("keydown", onKey);
  });
  onCleanup(() => {
    window.removeEventListener("keydown", onKey);
  });

  function handleInput(e: Event) {
    const v = (e.currentTarget as HTMLInputElement).value;
    setQuery(v);
    setSel(0);
  }

  function handleKey(e: KeyboardEvent) {
    const list = filtered();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel(Math.min(sel() + 1, list.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel(Math.max(sel() - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      list[sel()]?.run();
      close();
    }
  }

  return (
    <Show when={open()}>
      <div class="cmd-overlay" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
        <div class="cmdp">
          <div class="ip">
            <input
              ref={inputEl}
              type="text"
              placeholder="Run a command, spawn a session, jump to a file…"
              value={query()}
              onInput={handleInput}
              onKeyDown={handleKey}
              autocomplete="off"
            />
          </div>
          <div class="list">
            <For each={filtered()}>
              {(a, i) => (
                <div
                  class={`row${i() === sel() ? " sel" : ""}`}
                  onMouseEnter={() => setSel(i())}
                  onClick={() => { a.run(); close(); }}
                >
                  <div class="ic">{a.ic}</div>
                  <div class="nm">
                    <b>{a.name}</b>
                    <span class="desc">{a.desc}</span>
                  </div>
                  <div class="shortcut">
                    <For each={a.shortcut}>
                      {(k) => <kbd>{k}</kbd>}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </div>
          <div class="footer">
            <span class="hint"><kbd>↑↓</kbd> navigate</span>
            <span class="hint"><kbd>↵</kbd> select</span>
            <span class="hint"><kbd>esc</kbd> close</span>
          </div>
        </div>
      </div>
    </Show>
  );
}
