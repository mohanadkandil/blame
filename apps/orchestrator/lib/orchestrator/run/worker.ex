defmodule Orchestrator.Run.Worker do
  @moduledoc ~S"""
  One GenServer per agent run. Spawns the agent CLI as a subprocess via
  Port, feeds lines to the configured adapter, broadcasts parsed events
  on `"run:#{id}"`.

  Opts:
    * `:id`        - run id (PubSub topic suffix). Required.
    * `:prompt`    - user prompt. Required.
    * `:cwd`       - directory to spawn the agent in. Defaults to project_root.
    * `:agent`     - adapter atom (`:claude`, ...). Defaults to `:claude`.
    * `:worktree`  - optional `Orchestrator.Worktree.t()` to clean up on stop.
  """

  # One-shot per spawn — never auto-restart. (:transient would respawn on
  # non-zero exit, but terminate/2 has already removed the worktree by then,
  # causing an infinite `Could not cd` loop.)
  use GenServer, restart: :temporary
  require Logger

  alias Orchestrator.{Agents, Worktree}

  def start_link(opts), do: GenServer.start_link(__MODULE__, opts)

  # ---- Callbacks ----

  @impl true
  def init(opts) do
    id = opts[:id] || System.unique_integer([:positive])
    prompt = opts[:prompt] || ""
    cwd = opts[:cwd] || Application.fetch_env!(:orchestrator, :project_root)
    adapter = Agents.for(opts[:agent])
    worktree = opts[:worktree]

    cmd = adapter.command(prompt)

    port =
      Port.open(
        {:spawn_executable, System.find_executable("bash")},
        [:binary, :exit_status, {:line, 1_048_576}, {:cd, cwd}, args: ["-lc", cmd]]
      )

    Logger.info("[run:#{id}] worker started in #{cwd}")

    {:ok, %{id: id, prompt: prompt, port: port, buf: "", adapter: adapter, worktree: worktree}}
  end

  @impl true
  def handle_info({port, {:data, {:eol, line}}}, %{port: port} = state) do
    full = state.buf <> line
    handle_line(full, state)
    {:noreply, %{state | buf: ""}}
  end

  def handle_info({port, {:data, {:noeol, chunk}}}, %{port: port} = state) do
    {:noreply, %{state | buf: state.buf <> chunk}}
  end

  def handle_info({port, {:exit_status, code}}, %{port: port} = state) do
    Logger.info("[run:#{state.id}] exit #{code}")
    broadcast(state.id, %{type: "done", exit_status: code})

    if code == 0,
      do: {:stop, :normal, state},
      else: {:stop, {:exit_status, code}, state}
  end

  @impl true
  def terminate(_reason, %{worktree: nil}), do: :ok

  def terminate(_reason, %{worktree: wt}) do
    # Best-effort cleanup. Failure logged inside Worktree.cleanup/1.
    Worktree.cleanup(wt)
    :ok
  end

  # ---- Event dispatch ----

  defp handle_line("", _state), do: :ok

  defp handle_line(line, %{adapter: adapter, id: id}) do
    case adapter.parse_line(line) do
      {:emit, ev} -> broadcast(id, ev)
      {:emit_many, evs} -> Enum.each(evs, &broadcast(id, &1))
      :skip -> :ok
    end
  end

  defp broadcast(id, payload) do
    Phoenix.PubSub.broadcast(
      Orchestrator.PubSub,
      "run:#{id}",
      {:agent_event, payload}
    )
  end
end
