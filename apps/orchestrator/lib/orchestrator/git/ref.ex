defmodule Orchestrator.Git.Ref do
  @moduledoc """
  Discriminated git ref type. Prevents "is `origin/foo` a branch or
  a remote-tracking ref?" class of bugs by tagging refs at parse time.

  Pattern lifted from Superset's `packages/host-service/src/runtime/git/refs.ts`.
  """

  @type t ::
          {:local, String.t()}
          | {:remote_tracking, String.t(), String.t()}
          | {:tag, String.t()}
          | {:head, String.t()}

  @doc """
  Parses a ref name into a tagged tuple.

      iex> Ref.parse("main")
      {:local, "main"}

      iex> Ref.parse("origin/main")
      {:remote_tracking, "origin", "main"}

      iex> Ref.parse("v1.2.3")
      {:tag, "v1.2.3"}

  Caller decides which kinds are valid in a given context; this just
  classifies. Empty input → `:error`.
  """
  @spec parse(String.t()) :: {:ok, t()} | :error
  def parse(""), do: :error

  def parse(name) when is_binary(name) do
    cond do
      String.match?(name, ~r/^[0-9a-f]{7,40}$/) ->
        {:ok, {:head, name}}

      String.starts_with?(name, "v") and String.match?(name, ~r/^v\d/) ->
        {:ok, {:tag, name}}

      String.contains?(name, "/") ->
        [remote | rest] = String.split(name, "/", parts: 2)
        {:ok, {:remote_tracking, remote, Enum.join(rest, "/")}}

      true ->
        {:ok, {:local, name}}
    end
  end

  @doc "Renders the ref as the string git wants on the CLI."
  @spec to_string(t()) :: String.t()
  def to_string({:local, name}), do: name
  def to_string({:remote_tracking, remote, name}), do: "#{remote}/#{name}"
  def to_string({:tag, name}), do: name
  def to_string({:head, sha}), do: sha

  @doc """
  Returns the best ref to fork a new branch from.

  Prefers `upstream/main`, then `origin/main`, then `main` — in that order.
  Forking from a remote-tracking ref avoids the "stale local main"
  bug Superset documented as phantom-drift.
  """
  @spec fork_point(String.t()) :: {:ok, t()} | {:error, term()}
  def fork_point(repo_root) do
    candidates = [
      {:remote_tracking, "upstream", "main"},
      {:remote_tracking, "origin", "main"},
      {:local, "main"},
      {:local, "master"}
    ]

    Enum.find_value(candidates, {:error, :no_fork_point}, fn ref ->
      if exists?(repo_root, ref), do: {:ok, ref}, else: nil
    end)
  end

  @spec exists?(String.t(), t()) :: boolean()
  def exists?(repo_root, ref) do
    {_, status} =
      System.cmd("git", ["rev-parse", "--verify", "--quiet", __MODULE__.to_string(ref)],
        cd: repo_root,
        stderr_to_stdout: true
      )

    status == 0
  end
end
