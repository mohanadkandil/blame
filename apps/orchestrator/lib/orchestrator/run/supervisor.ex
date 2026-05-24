defmodule Orchestrator.Run.Supervisor do
  use DynamicSupervisor

  def start_link(_init_arg),
    do: DynamicSupervisor.start_link(__MODULE__, :ok, name: __MODULE__)

  @impl true
  def init(:ok), do: DynamicSupervisor.init(strategy: :one_for_one)

  @doc """
  Spawn a new agent run.
  Opts: `:id` (run id, used as PubSub topic), `:prompt` (string).
  Returns `{:ok, pid}` or `{:error, reason}`.
  """
  def start_run(opts) do
    DynamicSupervisor.start_child(__MODULE__, {Orchestrator.Run.Worker, opts})
  end
end
