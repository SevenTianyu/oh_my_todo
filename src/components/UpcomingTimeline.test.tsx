import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UpcomingTimeline } from "./UpcomingTimeline";

describe("UpcomingTimeline", () => {
  it("renders each interview as an agenda row with split date and time", () => {
    render(
      <UpcomingTimeline
        interviews={[
          {
            companyName: "Anthropic",
            roleName: "PM",
            roundId: "r-1",
            roundName: "Hiring Manager",
            scheduledAt: "2026-04-24T13:00:00+08:00"
          }
        ]}
      />
    );

    expect(screen.getByRole("heading", { name: "未来 7 天安排" })).toBeInTheDocument();
    expect(screen.getByText("Anthropic")).toBeInTheDocument();
    expect(screen.getByText("Hiring Manager")).toBeInTheDocument();
    expect(screen.getByText("PM")).toBeInTheDocument();
    expect(screen.getByText("4/24")).toBeInTheDocument();
  });
});
