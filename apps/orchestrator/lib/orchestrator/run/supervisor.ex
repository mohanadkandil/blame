defmodule Orchestrator.Run.Supervisor do
  use DynamicSupervisor

  def start_link(_), do: DynamicSupervisor.start_link(__MODULE__, [], name: __MODULE__)

  @impl true
  def init(:ok), do: DynamicSupervisor.init(strategy: :one_for_one)

  def start_run(opts),
    do: DynamicSupervisor.start_link(__MODULE__, {Orchestrator.Run.Worker, opts})
end
