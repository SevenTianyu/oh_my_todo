import type { CompensationNegotiation, NegotiationSnapshot } from "../types/interview";
import { describe, expect, it } from "vitest";
import { getLatestNegotiationSnapshot, getNegotiationMetrics } from "./compensation";

function createSnapshot(
  overrides: Partial<NegotiationSnapshot> = {}
): NegotiationSnapshot {
  return {
    version: 1,
    id: "snap-1",
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
    notes: "",
    ...overrides
  };
}

function createNegotiation(
  overrides: Partial<CompensationNegotiation> = {}
): CompensationNegotiation {
  return {
    status: "active",
    sourceProcessId: "process-1",
    startedAt: "2026-04-19T09:00:00.000Z",
    endedAt: null,
    latestSnapshotId: "snap-2",
    snapshots: [
      createSnapshot({ id: "snap-1", version: 1, title: "Initial" }),
      createSnapshot({ id: "snap-2", version: 2, title: "Latest" })
    ],
    ...overrides
  };
}

describe("compensation", () => {
  it("computes first-year and annualized totals from the latest negotiation snapshot", () => {
    const metrics = getNegotiationMetrics(createSnapshot({ id: "snap-2", version: 2 }));

    expect(metrics.firstYearCash).toBe(930000);
    expect(metrics.equityAnnualized).toBe(18000);
    expect(metrics.firstYearTotal).toBe(948000);
    expect(metrics.longTermAnnualizedTotal).toBe(888000);
  });

  it("keeps cash-derived totals null when required cash fields are missing", () => {
    const missingBaseMetrics = getNegotiationMetrics(createSnapshot({ baseMonthlySalary: null }));
    const missingBonusMetrics = getNegotiationMetrics(createSnapshot({ annualBonusCash: null }));

    expect(missingBaseMetrics.firstYearCash).toBeNull();
    expect(missingBaseMetrics.firstYearTotal).toBeNull();
    expect(missingBaseMetrics.longTermAnnualizedTotal).toBeNull();
    expect(missingBaseMetrics.equityAnnualized).toBe(18000);

    expect(missingBonusMetrics.firstYearCash).toBeNull();
    expect(missingBonusMetrics.firstYearTotal).toBeNull();
    expect(missingBonusMetrics.longTermAnnualizedTotal).toBeNull();
  });

  it("keeps equity-derived values null when required equity fields are missing", () => {
    const metrics = getNegotiationMetrics(createSnapshot({ equityShares: null }));

    expect(metrics.equityAnnualized).toBeNull();
    expect(metrics.firstYearCash).toBe(930000);
    expect(metrics.firstYearTotal).toBeNull();
    expect(metrics.longTermAnnualizedTotal).toBeNull();
  });

  it("rejects non-positive vesting years for annualized equity math", () => {
    expect(
      getNegotiationMetrics(createSnapshot({ equityVestingYears: 0 })).equityAnnualized
    ).toBeNull();
    expect(
      getNegotiationMetrics(createSnapshot({ equityVestingYears: -2 })).equityAnnualized
    ).toBeNull();
  });

  it("returns the explicit latest snapshot when latestSnapshotId is present", () => {
    const negotiation = createNegotiation();

    expect(getLatestNegotiationSnapshot(negotiation)?.id).toBe("snap-2");
  });

  it("falls back to the last snapshot when latestSnapshotId is missing or stale", () => {
    const negotiation = createNegotiation({ latestSnapshotId: "missing-id" });

    expect(getLatestNegotiationSnapshot(negotiation)?.id).toBe("snap-2");
    expect(getLatestNegotiationSnapshot(createNegotiation({ latestSnapshotId: null }))?.id).toBe(
      "snap-2"
    );
  });
});
