defmodule Orchestrator.Worktree do
  @moduledoc """
  Per-agent git worktrees. Each agent gets its own working dir off a
  fresh branch forked from upstream/main (or origin/main fallback).

  Layout (mirrors Superset's flat-per-project pattern):

      <worktrees_dir>/<project_hash>/<branch_name>/

  Branch naming:  `cadence/agent-<run_id>`
  """

  alias Orchestrator.Git.Ref
  require Logger

  @type create_opts :: [run_id: term(), project_root: Path.t() | nil]
  @type t :: %{run_id: term(), branch: String.t(), path: Path.t(), project_root: Path.t()}

  @spec create(create_opts()) :: {:ok, t()} | {:error, term()}
  def create(opts) do
    run_id = Keyword.fetch!(opts, :run_id)

    project_root =
      Keyword.get(opts, :project_root) || Application.fetch_env!(:orchestrator, :project_root)

    with {:ok, fork_ref} <- Ref.fork_point(project_root),
         branch = branch_name(run_id),
         {:ok, path} <- safe_resolve_path(project_root, branch),
         :ok <- ensure_parent_dir(path),
         :ok <- prune_stale(project_root),
         :ok <- git_worktree_add(project_root, path, branch, fork_ref) do
      Logger.info("[worktree] created #{path} from #{Ref.to_string(fork_ref)}")
      {:ok, %{run_id: run_id, branch: branch, path: path, project_root: project_root}}
    else
      {:error, reason} = err ->
        Logger.error("[worktree] create failed: #{inspect(reason)}")
        err
    end
  end

  @doc "Removes the worktree dir + the branch. Best-effort; errors logged not raised."
  @spec cleanup(t()) :: :ok
  def cleanup(%{project_root: root, path: path, branch: branch}) do
    case System.cmd("git", ["worktree", "remove", "--force", path],
           cd: root,
           stderr_to_stdout: true
         ) do
      {_, 0} -> :ok
      {out, code} -> Logger.warning("[worktree] remove failed (#{code}): #{out}")
    end

    case System.cmd("git", ["branch", "-D", branch], cd: root, stderr_to_stdout: true) do
      {_, 0} -> :ok
      {out, code} -> Logger.warning("[worktree] branch delete failed (#{code}): #{out}")
    end

    :ok
  end

  # ---- Internals ----

  @doc """
  Resolves the worktree dir for a given project + branch and asserts the
  result stays *inside* `worktrees_dir`. Defends against branch names
  containing `../` etc.

  Returns `{:error, :path_traversal}` if the resolved path escapes the root.
  """
  @spec safe_resolve_path(Path.t(), String.t()) :: {:ok, Path.t()} | {:error, :path_traversal}
  def safe_resolve_path(project_root, branch) do
    base = Application.fetch_env!(:orchestrator, :worktrees_dir) |> Path.expand()
    project_dir = Path.join(base, project_hash(project_root))
    candidate = Path.expand(Path.join(project_dir, branch))

    if String.starts_with?(candidate, project_dir <> "/") or candidate == project_dir do
      {:ok, candidate}
    else
      {:error, :path_traversal}
    end
  end

  defp ensure_parent_dir(path) do
    case File.mkdir_p(Path.dirname(path)) do
      :ok -> :ok
      {:error, reason} -> {:error, {:mkdir_failed, reason}}
    end
  end

  defp prune_stale(root) do
    System.cmd("git", ["worktree", "prune"], cd: root, stderr_to_stdout: true)
    :ok
  end

  defp git_worktree_add(root, path, branch, fork_ref) do
    args = ["worktree", "add", "--no-track", "-b", branch, path, Ref.to_string(fork_ref)]

    case System.cmd("git", args, cd: root, stderr_to_stdout: true) do
      {_, 0} -> :ok
      {out, code} -> {:error, {:git_worktree_add_failed, code, String.trim(out)}}
    end
  end

  defp branch_name(run_id), do: "cadence/agent-#{run_id}"

  # Short stable hash of the project root path. Collisions OK (same project hashes same).
  defp project_hash(root) do
    :crypto.hash(:sha256, root)
    |> Base.encode16(case: :lower)
    |> binary_part(0, 12)
  end
end
