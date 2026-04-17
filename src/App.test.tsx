import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

afterEach(() => {
  vi.useRealTimers();
});

describe("App", () => {
  it("renders the workbench shell and the default company-type groups", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "面试工作台" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "未来 7 天面试" })).toBeInTheDocument();
    expect(screen.getByText("创业公司")).toBeInTheDocument();
    expect(screen.getByText("大厂")).toBeInTheDocument();
    expect(screen.getByText("归档流程（1）")).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.getByLabelText("分组切换")).toBeInTheDocument();
  });

  it("switches grouping tabs without reloading the page", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "按个人优先级分组" }));

    expect(screen.getByText("高优先级")).toBeInTheDocument();
    expect(screen.getByText("中优先级")).toBeInTheDocument();
  });

  it("adds a pending round to the upcoming timeline when the user schedules it", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-17T09:00:00-07:00"));

    render(<App />);

    const timeline = screen.getByRole("heading", { name: "未来 7 天面试" }).closest("section");
    expect(within(timeline!).queryByText("Nova AI")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "展开 Nova AI" }));

    fireEvent.change(screen.getByLabelText("Nova AI-初筛沟通-时间"), {
      target: { value: "2026-04-20T09:30" }
    });

    expect(within(timeline!).getByText("Nova AI")).toBeInTheDocument();
    expect(within(timeline!).getByText("初筛沟通")).toBeInTheDocument();
  });

  it("uses the actual current date for the upcoming timeline window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T09:00:00-07:00"));

    render(<App />);

    const timeline = screen.getByRole("heading", { name: "未来 7 天面试" }).closest("section");

    expect(within(timeline!).queryByText("ACME")).not.toBeInTheDocument();
    expect(within(timeline!).queryByText("字节跳动")).not.toBeInTheDocument();
  });
});
