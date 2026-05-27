defmodule Orchestrator.Agents do
  @moduledoc """
  Behaviour every CLI agent adapter implements. One module per supported
  CLI (claude, codex, gemini, ...) under `Orchestrator.Agents.*`.

  Extension point inspired by Superset's `agent-setup/agent-wrappers-*.ts`:
  add a new agent = add a new module that implements this behaviour. The
  Worker stays generic.
  """

  @typedoc "Normalised event the UI knows how to render."
  @type event ::
          %{required(:type) => String.t(), optional(atom()) => any()}

  @doc "Shell command string to run the agent with `prompt` as its input."
  @callback command(prompt :: String.t()) :: String.t()

  @doc """
  Parse one line of agent stdout. Returns:

    * `{:emit, event}`  — broadcast this event to subscribers
    * `{:emit_many, [event]}` — broadcast a list of events
    * `:skip`          — line carries no UI-visible info
  """
  @callback parse_line(line :: String.t()) :: {:emit, event()} | {:emit_many, [event()]} | :skip

  @doc "Looks up the adapter module by atom name. Defaults to claude."
  @spec for(atom() | nil) :: module()
  def for(nil), do: __MODULE__.Claude
  def for(:claude), do: __MODULE__.Claude
  def for(other), do: raise(ArgumentError, "unknown agent: #{inspect(other)}")
end
