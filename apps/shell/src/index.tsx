/* @refresh reload */
import { render } from "solid-js/web";
import "./lib/theme"; // applies data-theme synchronously → zero flash
import App from "./App";

render(() => <App />, document.getElementById("root") as HTMLElement);
