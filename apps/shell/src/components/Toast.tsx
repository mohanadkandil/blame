import { Show } from "solid-js";
import { toastMsg } from "../lib/store";

export default function Toast() {
  return (
    <Show when={toastMsg()}>
      <div class="toast">
        <span class="ic">✓</span>
        <span>{toastMsg()}</span>
      </div>
    </Show>
  );
}
