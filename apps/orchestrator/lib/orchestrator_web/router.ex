defmodule OrchestratorWeb.Router do
  use OrchestratorWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/api", OrchestratorWeb do
    pipe_through :api
  end
end
