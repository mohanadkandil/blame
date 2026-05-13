defmodule Math do
  def double(x) do
    x * 2
  end

  def add(a, b), do: a + b
end

defmodule Greeter do
  def hello(:morning), do: "good morning"
  def hello(:evening), do: "good evening"
  def hello(_anything), do: "hi"
end
