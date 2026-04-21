import { describe, expect, it } from "vitest";
import { getNegotiationMetrics } from "./compensation";

describe("compensation", () => {
  it("computes first-year and annualized totals from the latest negotiation snapshot", () => {
    const metrics = getNegotiationMetrics({
      version: 2,
      id: "snap-2",
      createdAt: "2026-04-19T12:00:00.000Z",
      title: "Senior PM",
      level: "P5",
      city: "San Francisco",
      workMode: "Hybrid",
      baseMonthlySalary: 50000,
      salaryMonths: 15,
      annualBonusCash: 120000,
      signOnBonus: 50000,
      relocationBonus: 10000,
      equityShares: 4000,
      equityStrikePrice: 12,
      equityReferencePrice: 30,
      equityVestingYears: 4,
      deadline: "2026-04-25",
      hrSignal: "可继续谈",
      notes: ""
    });

    expect(metrics.firstYearCash).toBe(930000);
    expect(metrics.equityAnnualized).toBe(18000);
    expect(metrics.firstYearTotal).toBe(948000);
    expect(metrics.longTermAnnualizedTotal).toBe(888000);
  });
});
