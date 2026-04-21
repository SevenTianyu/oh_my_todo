import type { CompensationNegotiation, NegotiationSnapshot } from "../types/interview";

export interface NegotiationMetrics {
  firstYearCash: number | null;
  equityAnnualized: number | null;
  firstYearTotal: number | null;
  longTermAnnualizedTotal: number | null;
}

export function getLatestNegotiationSnapshot(
  negotiation: CompensationNegotiation
): NegotiationSnapshot | null {
  if (negotiation.latestSnapshotId) {
    const latestSnapshot = negotiation.snapshots.find(
      (snapshot) => snapshot.id === negotiation.latestSnapshotId
    );

    if (latestSnapshot) {
      return latestSnapshot;
    }
  }

  return negotiation.snapshots.at(-1) ?? null;
}

export function getNegotiationMetrics(snapshot: NegotiationSnapshot): NegotiationMetrics {
  const annualCash =
    snapshot.baseMonthlySalary !== null && snapshot.salaryMonths !== null
      ? snapshot.baseMonthlySalary * snapshot.salaryMonths
      : null;

  const firstYearCash =
    annualCash !== null && snapshot.annualBonusCash !== null
      ? annualCash + snapshot.annualBonusCash + (snapshot.signOnBonus ?? 0) + (snapshot.relocationBonus ?? 0)
      : null;

  const equityAnnualized =
    snapshot.equityShares !== null &&
    snapshot.equityReferencePrice !== null &&
    snapshot.equityStrikePrice !== null &&
    snapshot.equityVestingYears !== null &&
    snapshot.equityVestingYears > 0
      ? ((snapshot.equityReferencePrice - snapshot.equityStrikePrice) * snapshot.equityShares) /
        snapshot.equityVestingYears
      : null;

  return {
    firstYearCash,
    equityAnnualized,
    firstYearTotal:
      firstYearCash !== null && equityAnnualized !== null ? firstYearCash + equityAnnualized : null,
    longTermAnnualizedTotal:
      annualCash !== null && snapshot.annualBonusCash !== null && equityAnnualized !== null
        ? annualCash + snapshot.annualBonusCash + equityAnnualized
        : null
  };
}
