import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the interview workbench shell", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "面试工作台" })).toBeInTheDocument();
    expect(screen.getByText("原型初始化完成。")).toBeInTheDocument();
  });
});
