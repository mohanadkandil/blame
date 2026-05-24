defmodule Orchestrator.Run.Worker do
  use GenServer, restart: :transient
  require Logger

  # Public API
  def start_link(opts), do: GenServer.start_link(__MODULE__, opts)

  # ---- Callbacks ----

  @impl true
  def init(opts) do
    id     = opts[:id] || System.unique_integer([:positive])
    prompt = opts[:prompt] || ""

    cmd =
      "claude -p #{escape(prompt)} --output-format stream-json --verbose </dev/null"

    port =
      Port.open(
        {:spawn_executable, System.find_executable("bash")},
        [:binary, :exit_status, {:line, 1_048_576}, args: ["-lc", cmd]]
      )

    Logger.info("[run:#{id}] worker started")
    {:ok, %{id: id, prompt: prompt, port: port, buf: ""}}
  end

  @impl true
  def handle_info({port, {:data, {:eol, line}}}, %{port: port} = state) do
    # complete line
    full = state.buf <> line
    handle_line(full, state)
    {:noreply, %{state | buf: ""}}
  end

  def handle_info({port, {:data, {:noeol, chunk}}}, %{port: port} = state) do
    # partial line — buffer until eol arrives
    {:noreply, %{state | buf: state.buf <> chunk}}
  end

  def handle_info({port, {:exit_status, code}}, %{port: port} = state) do
    Logger.info("[run:#{state.id}] exit #{code}")
    broadcast(state.id, %{type: "done", exit_status: code})

    if code == 0,
      do: {:stop, :normal, state},
      else: {:stop, {:exit_status, code}, state}
  end

  # ---- Event dispatch ----

  defp handle_line("", _state), do: :ok

  defp handle_line(line, state) do
    case Jason.decode(line) do
      {:ok, event} -> dispatch(event, state)
      {:error, _}  -> Logger.debug("[run:#{state.id}] non-json: #{line}")
    end
  end

  # Assistant message — may contain text + tool_use blocks
  defp dispatch(%{"type" => "assistant", "message" => %{"content" => content}}, state)
       when is_list(content) do
    text = extract_text(content)

    if text != "",
      do: broadcast(state.id, %{type: "text", text: text})

    Enum.each(content, fn
      %{"type" => "tool_use", "name" => name} = tu ->
        broadcast(state.id, %{
          type: "tool_use",
          tool_id: tu["id"],
          name: name,
          input: tu["input"] || %{}
        })

      _ ->
        :ok
    end)
  end

  # Tool result (Claude returns as user role with tool_result blocks)
  defp dispatch(%{"type" => "user", "message" => %{"content" => content}}, state)
       when is_list(content) do
    Enum.each(content, fn
      %{"type" => "tool_result", "tool_use_id" => tid} = tr ->
        broadcast(state.id, %{
          type: "tool_result",
          tool_id: tid,
          output: stringify_result(tr["content"])
        })

      _ ->
        :ok
    end)
  end

  # Final result summary
  defp dispatch(%{"type" => "result"} = ev, state) do
    broadcast(state.id, %{
      type: "result",
      result: ev["result"],
      cost_usd: ev["total_cost_usd"],
      duration_ms: ev["duration_ms"]
    })
  end

  defp dispatch(_other, _state), do: :ok

  # ---- Helpers ----

  defp extract_text(content) do
    content
    |> Enum.filter(&match?(%{"type" => "text"}, &1))
    |> Enum.map_join("", & &1["text"])
  end

  defp stringify_result(nil), do: ""
  defp stringify_result(s) when is_binary(s), do: s
  defp stringify_result(blocks) when is_list(blocks) do
    blocks
    |> Enum.map(fn
      %{"type" => "text", "text" => t} -> t
      other -> inspect(other)
    end)
    |> Enum.join("\n")
  end
  defp stringify_result(other), do: inspect(other)

  defp broadcast(id, payload) do
    Phoenix.PubSub.broadcast(
      Orchestrator.PubSub,
      "run:#{id}",
      {:agent_event, payload}
    )
  end

  # Single-quote the prompt for bash -lc, escape embedded single quotes.
  defp escape(s) do
    "'" <> String.replace(s, "'", "'\\''") <> "'"
  end
end
