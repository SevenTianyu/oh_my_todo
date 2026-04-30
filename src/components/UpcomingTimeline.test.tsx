import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { parseInterviewDateTime } from "../lib/beijingTime";
import { UpcomingTimeline } from "./UpcomingTimeline";

function getExpectedAgendaParts(value: string) {
  const date = parseInterviewDateTime(value);

  return {
    dayLabel: new Intl.DateTimeFormat("zh-CN", {
      month: "numeric",
      day: "numeric",
      timeZone: "Asia/Shanghai"
    }).format(date),
    weekdayLabel: new Intl.DateTimeFormat("zh-CN", {
      weekday: "short",
      timeZone: "Asia/Shanghai"
    }).format(date),
    timeLabel: new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Shanghai"
    }).format(date)
  };
}

describe("UpcomingTimeline", () => {
  it("renders each interview as an agenda row with split local date, weekday, and time", () => {
    const scheduledAt = "2026-04-24T13:00:00";
    const { dayLabel, weekdayLabel, timeLabel } = getExpectedAgendaParts(scheduledAt);

    render(
      <UpcomingTimeline
        interviews={[
          {
            companyId: "c-1",
            companyName: "Anthropic",
            processId: "p-1",
            roleName: "PM",
            roundId: "r-1",
            roundName: "Hiring Manager",
            scheduledAt
          }
        ]}
      />
    );

    expect(screen.getByText("未来 7 天安排")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "未来 7 天安排" })).not.toBeInTheDocument();
    expect(screen.getByText("Anthropic")).toBeInTheDocument();
    expect(screen.getByText("Hiring Manager")).toBeInTheDocument();
    expect(screen.getByText("PM")).toBeInTheDocument();
    expect(screen.getByText(dayLabel)).toBeInTheDocument();
    expect(screen.getByText(weekdayLabel)).toBeInTheDocument();
    expect(screen.getByText(timeLabel)).toBeInTheDocument();
  });

  it("formats timestamps with offsets in Beijing time", () => {
    const scheduledAt = "2026-04-24T13:00:00+08:00";
    const { dayLabel, weekdayLabel, timeLabel } = getExpectedAgendaParts(scheduledAt);

    render(
      <UpcomingTimeline
        interviews={[
          {
            companyId: "c-1",
            companyName: "Anthropic",
            processId: "p-1",
            roleName: "PM",
            roundId: "r-1",
            roundName: "Hiring Manager",
            scheduledAt
          }
        ]}
      />
    );

    expect(screen.getByText(dayLabel)).toBeInTheDocument();
    expect(screen.getByText(weekdayLabel)).toBeInTheDocument();
    expect(screen.getByText(timeLabel)).toBeInTheDocument();
  });

  it("renders deterministic fallback labels for malformed scheduled times", () => {
    render(
      <UpcomingTimeline
        interviews={[
          {
            companyId: "c-1",
            companyName: "Anthropic",
            processId: "p-1",
            roleName: "PM",
            roundId: "r-1",
            roundName: "Hiring Manager",
            scheduledAt: "not-a-date"
          }
        ]}
      />
    );

    expect(screen.getByText("Anthropic")).toBeInTheDocument();
    expect(screen.getByText("Hiring Manager")).toBeInTheDocument();
    expect(screen.getByText("PM")).toBeInTheDocument();
    expect(screen.getByText("--/--")).toBeInTheDocument();
    expect(screen.getByText("未知")).toBeInTheDocument();
    expect(screen.getByText("--:--")).toBeInTheDocument();
  });

  it("calls onRefresh from the agenda refresh button", async () => {
    const onRefresh = vi.fn();
    const user = userEvent.setup();

    render(<UpcomingTimeline interviews={[]} onRefresh={onRefresh} />);

    await user.click(screen.getByRole("button", { name: "刷新未来 7 天安排" }));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
