import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the upcoming timeline and the default company-type groups", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "未来 7 天面试" })).toBeInTheDocument();
    expect(screen.getByText("创业公司")).toBeInTheDocument();
    expect(screen.getByText("大厂")).toBeInTheDocument();
    expect(screen.getAllByText("ACME")).toHaveLength(2);
    expect(screen.getAllByText("字节跳动")).toHaveLength(2);
  });

  it("switches grouping tabs without reloading the page", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "按个人优先级分组" }));

    expect(screen.getByText("高优先级")).toBeInTheDocument();
    expect(screen.getByText("中优先级")).toBeInTheDocument();
  });
});
