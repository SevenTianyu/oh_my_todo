import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { OfferComparisonRow } from "../lib/selectors";
import { sampleCompanies } from "../lib/sampleData";
import { OfferComparisonPanel } from "./OfferComparisonPanel";

describe("OfferComparisonPanel", () => {
  it("defaults to active negotiations and can switch to all negotiated companies", async () => {
    const user = userEvent.setup();
    const onScopeChange = vi.fn();
    const rows: OfferComparisonRow[] = [
      {
        companyId: "acme",
        companyName: "ACME",
        sourceProcessId: "acme-pm",
        sourceRoleName: "Senior PM",
        latestVersion: 2,
        latestSnapshot: sampleCompanies[3].negotiation.snapshots[0]!,
        metrics: {
          firstYearCash: 880000,
          equityAnnualized: 18000,
          firstYearTotal: 898000,
          longTermAnnualizedTotal: 848000
        }
      },
      {
        companyId: "google",
        companyName: "Google",
        sourceProcessId: "google-ads",
        sourceRoleName: "PM",
        latestVersion: 1,
        latestSnapshot: sampleCompanies[4].negotiation.snapshots[0]!,
        metrics: {
          firstYearCash: 760000,
          equityAnnualized: 22000,
          firstYearTotal: 782000,
          longTermAnnualizedTotal: 772000
        }
      }
    ];
    const { rerender } = render(
      <OfferComparisonPanel rows={[rows[0]]} scope="active" onScopeChange={onScopeChange} />
    );

    expect(screen.getByText("ACME")).toBeInTheDocument();
    expect(screen.getByText("5.2 万 × 15 薪")).toBeInTheDocument();
    expect(screen.getByText("89.8 万")).toBeInTheDocument();
    expect(screen.queryByText("Google")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "全部有薪资记录的公司" }));
    expect(onScopeChange).toHaveBeenCalledWith("all");

    rerender(<OfferComparisonPanel rows={rows} scope="all" onScopeChange={onScopeChange} />);

    expect(screen.getByText("Google")).toBeInTheDocument();
    expect(screen.getByText("4.2 万 × 15 薪")).toBeInTheDocument();
  });
});
