import Sidebar from "./components/Sidebar";
import ChatPanel from "./components/ChatPanel";
import RightPanel from "./components/RightPanel";
import CommandPalette from "./components/CommandPalette";
import Toast from "./components/Toast";
import "./styles.css";

export default function App() {
  return (
    <>
      <div class="app">
        <Sidebar />
        <ChatPanel />
        <RightPanel />
      </div>
      <CommandPalette />
      <Toast />
    </>
  );
}
