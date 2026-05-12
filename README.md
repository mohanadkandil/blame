# blame

Mac-native agent orchestrator. Run a team of coding agents in parallel on your Mac.

> **Status:** v0.1 MVP scaffold. Single-agent pipe end-to-end. See `docs/MVP_FEATURES.md` for the roadmap.

---

## Architecture (one Mac, three processes)

```
┌────────────────────────────────────────────────┐
│  shell/    Tauri 2 + SolidJS                   │
│            Native macOS window                 │
│            ↕ WebSocket on localhost:4000       │
└────────────────────────────────────────────────┘
                       │
┌────────────────────────────────────────────────┐
│  orchestrator/   Elixir + Phoenix + OTP        │
│                  Supervises agent workers      │
│                  Broadcasts events via PubSub  │
└────────────────────────────────────────────────┘
                       │ spawn (Port)
                       ▼
┌────────────────────────────────────────────────┐
│  agent subprocesses (one per run)              │
│  Each in its own git worktree                  │
└────────────────────────────────────────────────┘
```

- **Tauri shell** owns the native window, system tray, signed binary
- **SolidJS** renders the diff-first review UI inside the window
- **Elixir orchestrator** spawns agents, supervises crashes, enforces budgets, broadcasts state
- **Agent subprocesses** are whatever harness binary you configure (set `AGENT_BINARY` env var)

---

## Prereqs

```bash
brew install elixir rust node
elixir --version    # need 1.17+
node --version      # need 20+
rustc --version     # need 1.75+
```

---

## Run it (dev)

Two terminals:

```bash
# Terminal 1 — orchestrator
cd orchestrator
mix deps.get
iex -S mix phx.server
# Listening on ws://localhost:4000

# Terminal 2 — shell
cd shell
npm install
npm run tauri dev
# Mac window opens
```

You should see the window, click **New agent**, and watch a fake agent tick in the log panel. That proves the pipe.

---

## Wire your real harness binary

Edit `orchestrator/config/dev.exs`:

```elixir
config :orchestrator,
  agent_binary: "/path/to/your/agent-cli",
  agent_args: ["--workspace"]
```

Restart `iex -S mix phx.server`. Spawning an agent now runs your binary inside a git worktree.

---

## Repo layout

```
blame/
├── README.md
├── docs/
│   ├── MVP_FEATURES.md         # feature roadmap (v0.1 → v0.4)
│   └── ARCHITECTURE.md         # deeper architecture notes
├── orchestrator/               # Elixir sidecar
│   ├── lib/orchestrator/
│   │   ├── application.ex      # supervision tree root
│   │   ├── agent_supervisor.ex # DynamicSupervisor for agent workers
│   │   ├── agent_worker.ex     # GenServer = one babysitter per agent
│   │   ├── git_worktree.ex     # worktree create/cleanup
│   │   └── ...
│   └── lib/orchestrator_web/   # WebSocket endpoint + channels
└── shell/                      # Tauri + SolidJS Mac app
    ├── src/                    # SolidJS UI
    └── src-tauri/              # Rust shell, sidecar boot
```

---

## License

MIT.
