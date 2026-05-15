defmodule Orchestrator.Run.Worker do
  use GenServer
  require Logger

  def start_link(opts), do: GenServer.start_link(__MODULE__, opts)

  @impl true
  def init(opts) do
    prompt = opts[:prompt]

    cmd =
      "claude -p #{inspect(prompt)} --output-format stream-json --verbose"

    port =
      Port.open(
        {:spawn_executable, System.find_executable("bash")},
        [:binary, :exit_status, {:line, 1_048_576}, args: ["-lc", cmd]]
      )

    {:ok, %{prompt: opts[:prompt], port: port}}
  end

  @impl true
  def handle_info({port, {:data, {_eol, line}}}, %{port: port} = state) do
    Logger.info("Received data from port: #{line}")
    {:noreply, state}
  end

  def handle_info({port, {:exit_status, code}}, %{port: port} = state) do
    Logger.info("Port exited with status: #{code}")
    {:stop, :normal, state}
  end
end
