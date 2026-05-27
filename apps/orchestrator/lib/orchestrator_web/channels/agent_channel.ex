defmodule OrchestratorWeb.AgentChannel do
  use Phoenix.Channel
  require Logger

  alias Orchestrator.{Run, Worktree}

  @impl true
  def join("agents", _params, socket), do: {:ok, socket}

  @impl true
  def handle_in("spawn", %{"prompt" => prompt} = params, socket) do
    id = System.unique_integer([:positive])
    Phoenix.PubSub.subscribe(Orchestrator.PubSub, "run:#{id}")

    isolate? = Map.get(params, "isolate", true)

    with {:ok, wt_opt} <- maybe_create_worktree(id, isolate?),
         spawn_opts =
           [id: id, prompt: prompt]
           |> with_worktree(wt_opt),
         {:ok, _pid} <- Run.Supervisor.start_run(spawn_opts) do
      Logger.info("[channel] spawned run:#{id}")
      {:reply, {:ok, spawn_reply(id, wt_opt)}, socket}
    else
      {:error, reason} ->
        Logger.error("[channel] spawn failed: #{inspect(reason)}")
        {:reply, {:error, %{reason: inspect(reason)}}, socket}
    end
  end

  @impl true
  def handle_info({:agent_event, ev}, socket) do
    push(socket, "agent_event", ev)
    {:noreply, socket}
  end

  # ---- Internals ----

  defp maybe_create_worktree(_id, false), do: {:ok, nil}

  defp maybe_create_worktree(id, true) do
    case Worktree.create(run_id: id) do
      {:ok, wt} ->
        {:ok, wt}

      # If worktree creation fails (not a git repo, no fork point, etc),
      # fall back to running in project_root so M1 behaviour still works.
      {:error, reason} ->
        Logger.warning("[channel] worktree disabled: #{inspect(reason)}")
        {:ok, nil}
    end
  end

  defp with_worktree(opts, nil), do: opts

  defp with_worktree(opts, wt) do
    opts
    |> Keyword.put(:cwd, wt.path)
    |> Keyword.put(:worktree, wt)
  end

  defp spawn_reply(id, nil), do: %{run_id: id, isolated: false}

  defp spawn_reply(id, wt),
    do: %{run_id: id, isolated: true, branch: wt.branch, path: wt.path}
end
