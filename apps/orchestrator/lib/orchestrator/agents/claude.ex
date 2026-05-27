defmodule Orchestrator.Agents.Claude do
  @moduledoc """
  Adapter for the `claude` CLI (Claude Code) using `--output-format stream-json`.

  Lines arrive as JSONL with shapes documented at
  https://docs.anthropic.com/en/docs/claude-code/sdk
  """

  @behaviour Orchestrator.Agents

  # Tools that don't make sense in headless -p mode (need a live UI loop
  # we haven't wired yet). Blocked at the CLI level so the agent never
  # tries to call them and then sits dead waiting for a response.
  @disallowed_tools [
    "AskUserQuestion",
    "EnterPlanMode",
    "ExitPlanMode",
    "EnterWorktree",
    "ExitWorktree",
    "ScheduleWakeup",
    "CronCreate",
    "CronDelete",
    "CronList",
    "PushNotification",
    "RemoteTrigger",
    "Monitor",
    "Skill",
    "Task"
  ]

  @impl true
  def command(prompt) do
    # `--setting-sources project,local` = ignore ~/.claude user-level settings
    #     so SessionStart hooks (e.g. caveman) don't leak into the spawned
    #     agent. Unlike `--bare`, this keeps OAuth + keychain auth working.
    # `--disable-slash-commands`        = nuke all skills too.
    # `--disallowed-tools`              = block interactive tools that need a
    #     two-way UI channel we haven't built yet.
    # `</dev/null`                      = skip 3s stdin wait the CLI does by default.
    flags = [
      "--setting-sources project,local",
      "--disable-slash-commands",
      "--disallowed-tools #{Enum.join(@disallowed_tools, " ")}",
      "--output-format stream-json",
      "--verbose"
    ]

    "claude -p #{Enum.join(flags, " ")} #{escape(prompt)} </dev/null"
  end

  @impl true
  def parse_line(""), do: :skip

  def parse_line(line) do
    case Jason.decode(line) do
      {:ok, ev} -> dispatch(ev)
      {:error, _} -> :skip
    end
  end

  # ---- Internals ----

  defp dispatch(%{"type" => "assistant", "message" => %{"content" => content}})
       when is_list(content) do
    text = extract_text(content)

    text_event =
      if text != "", do: [%{type: "text", text: text}], else: []

    tool_events =
      content
      |> Enum.flat_map(fn
        %{"type" => "tool_use"} = tu ->
          [%{type: "tool_use", tool_id: tu["id"], name: tu["name"], input: tu["input"] || %{}}]

        _ ->
          []
      end)

    case text_event ++ tool_events do
      [] -> :skip
      [one] -> {:emit, one}
      many -> {:emit_many, many}
    end
  end

  defp dispatch(%{"type" => "user", "message" => %{"content" => content}})
       when is_list(content) do
    events =
      content
      |> Enum.flat_map(fn
        %{"type" => "tool_result", "tool_use_id" => tid} = tr ->
          [%{type: "tool_result", tool_id: tid, output: stringify_result(tr["content"])}]

        _ ->
          []
      end)

    case events do
      [] -> :skip
      [one] -> {:emit, one}
      many -> {:emit_many, many}
    end
  end

  defp dispatch(%{"type" => "result"} = ev) do
    {:emit,
     %{
       type: "result",
       result: ev["result"],
       cost_usd: ev["total_cost_usd"],
       duration_ms: ev["duration_ms"]
     }}
  end

  defp dispatch(_), do: :skip

  defp extract_text(content) do
    content
    |> Enum.filter(&match?(%{"type" => "text"}, &1))
    |> Enum.map_join("", & &1["text"])
  end

  defp stringify_result(nil), do: ""
  defp stringify_result(s) when is_binary(s), do: s

  defp stringify_result(blocks) when is_list(blocks) do
    Enum.map_join(blocks, "\n", fn
      %{"type" => "text", "text" => t} -> t
      other -> inspect(other)
    end)
  end

  defp stringify_result(other), do: inspect(other)

  defp escape(s) do
    "'" <> String.replace(s, "'", "'\\''") <> "'"
  end
end
