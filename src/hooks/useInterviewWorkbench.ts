import { useMemo, useState } from "react";
import {
  addRoundToProcess,
  archiveProcessById,
  updateCompanySummary,
  updateRoundRecord
} from "../lib/mutations";
import { sampleCompanies } from "../lib/sampleData";
import { getArchivedCompanies, getGroupedCompanies, getUpcomingInterviews } from "../lib/selectors";
import type { CompanyRecord, GroupingMode, RoundRecord } from "../types/interview";

const NOW = new Date("2026-04-17T09:00:00-07:00");

type CompanySummaryPatch = Partial<
  Pick<CompanyRecord, "overallImpression" | "highlights" | "risks" | "priority">
>;

export function useInterviewWorkbench(initialCompanies: CompanyRecord[] = sampleCompanies) {
  const [grouping, setGrouping] = useState<GroupingMode>("companyType");
  const [companies, setCompanies] = useState<CompanyRecord[]>(initialCompanies);

  return {
    grouping,
    setGrouping,
    companies,
    groupedCompanies: useMemo(() => getGroupedCompanies(companies, grouping), [companies, grouping]),
    archivedCompanies: useMemo(() => getArchivedCompanies(companies), [companies]),
    upcomingInterviews: useMemo(() => getUpcomingInterviews(companies, NOW), [companies]),
    updateCompanySummary: (companyId: string, patch: CompanySummaryPatch) =>
      setCompanies((current) => updateCompanySummary(current, companyId, patch)),
    addRoundToProcess: (companyId: string, processId: string) =>
      setCompanies((current) => addRoundToProcess(current, companyId, processId)),
    archiveProcessById: (companyId: string, processId: string) =>
      setCompanies((current) => archiveProcessById(current, companyId, processId)),
    updateRoundRecord: (
      companyId: string,
      processId: string,
      roundId: string,
      patch: Partial<RoundRecord>
    ) => setCompanies((current) => updateRoundRecord(current, companyId, processId, roundId, patch))
  };
}
