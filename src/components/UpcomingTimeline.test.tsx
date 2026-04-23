import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UpcomingTimeline } from "./UpcomingTimeline";

function getExpectedAgendaParts(value: string) {
  const date = new Date(value);

  return {
    dayLabel: new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(date),
    weekdayLabel: new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(date),
    timeLabel: new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
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

    expect(screen.getByRole("heading", { name: "未来 7 天安排" })).toBeInTheDocument();
    expect(screen.getByText("Anthropic")).toBeInTheDocument();
    expect(screen.getByText("Hiring Manager")).toBeInTheDocument();
    expect(screen.getByText("PM")).toBeInTheDocument();
    expect(screen.getByText(dayLabel)).toBeInTheDocument();
    expect(screen.getByText(weekdayLabel)).toBeInTheDocument();
    expect(screen.getByText(timeLabel)).toBeInTheDocument();
  });

  it("uses actual date parsing semantics for timestamps that include offsets", () => {
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
});
