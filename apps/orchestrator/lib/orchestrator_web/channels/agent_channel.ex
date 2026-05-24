defmodule OrchestratorWeb.AgentChannel do
  use Phoenix.Channel
  require Logger

  @impl true
  def join("agents", _params, socket), do: {:ok, socket}

  @impl true
  def handle_in("spawn", %{"prompt" => prompt}, socket) do
    id = System.unique_integer([:positive])
    Phoenix.PubSub.subscribe(Orchestrator.PubSub, "run:#{id}")

    case Orchestrator.Run.Supervisor.start_run(id: id, prompt: prompt) do
      {:ok, _pid} ->
        Logger.info("[channel] spawned run:#{id}")
        {:reply, {:ok, %{run_id: id}}, socket}

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
end
