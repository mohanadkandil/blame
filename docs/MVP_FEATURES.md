# MVP Feature Roadmap

Four phases, two weeks each, one engineer.

## v0.1 — "Spawn one" (this MVP)

Goal: prove the pipe end-to-end. One agent, one log stream, one merge.

- [x] Tauri shell boots, opens native macOS window
- [x] Elixir orchestrator boots as sidecar
- [x] WebSocket pipe between shell and orchestrator (localhost:4000)
- [x] DynamicSupervisor + GenServer pattern for agent workers
- [x] `Application` supervisor with `:one_for_one` strategy
- [ ] "Add repo" button — user picks a local git repo
- [ ] "New agent" button — spawns one agent in a fresh git worktree
- [ ] Agent subprocess streams stdout/stderr to UI via PubSub
- [ ] On agent exit → show diff in a Monaco-based diff viewer
- [ ] "Approve" → merge worktree branch back into main, delete worktree
- [ ] "Discard" → delete worktree, no merge
- [ ] Crash test: if agent process dies, supervisor restarts it without taking down the rest

**Demo target:** record a 90-second Loom of "open app → add repo → spawn agent → watch log → review diff → merge."

## v0.2 — "Spawn N"

Goal: parallel agents. The headline Conductor feature.

- [ ] Spawn N agents at once, each in its own worktree
- [ ] Sidebar lists every active agent with live status (running, idle, finished, crashed)
- [ ] Per-agent log panel (click sidebar entry → see that agent's stream)
- [ ] Per-agent diff panel
- [ ] Cancel an in-flight agent (sends `:stop` to its GenServer, cleans up)
- [ ] Worktree cleanup on cancel/crash (no zombie checkouts)
- [ ] Configurable agent binary (`AGENT_BINARY` env var) so users plug in their own harness
- [ ] Multi-model: tag each spawn with model name; toggle between Claude/Codex/etc

## v0.3 — "Verify" (the wedge)

Goal: differentiator vs Conductor. Standalone QA agent reviews every other agent's output.

- [ ] After primary agent exits cleanly → spawn a `VerifierWorker` for the same diff
- [ ] Verifier reads (spec, diff) → returns score 1-10 + justification
- [ ] Score shown in UI before merge button activates
- [ ] If score < 5 → merge button disabled, suggestion shown
- [ ] Verifier results saved to local SQLite (training signal flywheel)
- [ ] Budget watchdog: each `AgentWorker` has a hard $ cap; exceeding → `{:stop, :budget_breached}`
- [ ] OpenTelemetry traces per run (local SQLite, opt-in PostHog upload)

## v0.4 — Polish + pitch

Goal: shippable v0.1 .dmg, demo Loom, application package for Conductor.

- [ ] Notarized .dmg (Apple Developer ID required)
- [ ] Sparkle auto-update integration
- [ ] App icon + brand polish
- [ ] First-run onboarding (3 screens: repo, harness binary, first spawn)
- [ ] Telemetry opt-in screen (privacy-first)
- [ ] Crash reporter (Sentry or local-only)
- [ ] Landing page (static, single page)
- [ ] 5-minute walkthrough Loom
- [ ] 1-page write-up framing the verification wedge
- [ ] Outreach: email Charlie + Jackson at Conductor, plus 5 backup targets

---

## Out of scope (for now)

These are real wedges but not v0.1-v0.4. Save for v0.5+ or skip entirely.

- Linear/GitHub control plane (Symphony pattern) — polling adds complexity
- Cross-team / multi-user / RBAC — single-user desktop only for now
- Cloud deployment — local Mac only
- PM/designer surface — devs first
- Multi-repo coordination — single repo per workspace
- Declarative agent spec format — too early, no standard

---

## Risks tracker

- **Anthropic ships built-in verification** — mitigate by making the verifier swap-in for any harness, plus lean into FinOps + attribution as second-order moats.
- **Tauri 2 macOS code-signing pain** — budget 2 days for first signed build; have Electron Forge as backup if blocked.
- **Elixir learning curve** — if it kills velocity in week 1, drop to Node + worker_threads for v0.1 and port to Elixir at v0.2 once supervision pain is concrete.
- **Conductor's UI is more polished** — don't try to beat it on UI. Pitch the missing layer.
