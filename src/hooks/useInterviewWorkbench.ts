import { useEffect, useMemo, useState } from "react";
import {
  addRoundToProcess,
  archiveProcessById,
  createCompanyWithProcess,
  deleteNegotiationSnapshot,
  finishNegotiation,
  saveNegotiationSnapshot,
  startNegotiation,
  updateCompanySummary,
  updateProcessRecord,
  updateRoundRecord
} from "../lib/mutations";
import {
  getArchivedCompanies,
  getGroupedCompanies,
  getNegotiationSuggestionProcessIds,
  getOfferComparisonRows,
  getUpcomingInterviews
} from "../lib/selectors";
import {
  createEmptyWorkbenchSnapshot,
  loadWorkbenchSnapshot,
  parseWorkbenchSnapshotImport,
  saveWorkbenchSnapshot
} from "../lib/storage";
import type {
  CompanyRecord,
  GroupingMode,
  InterviewProcess,
  NegotiationSnapshot,
  NegotiationStatus,
  NewCompanyDraft,
  RoundRecord
} from "../types/interview";

type CompanySummaryPatch = Partial<Pick<CompanyRecord, "name" | "companyType" | "overallImpression">>;

export function useInterviewWorkbench() {
  const [snapshot, setSnapshot] = useState(() => loadWorkbenchSnapshot() ?? createEmptyWorkbenchSnapshot());
  const [comparisonScope, setComparisonScope] = useState<"active" | "all">("active");

  useEffect(() => {
    saveWorkbenchSnapshot(snapshot);
  }, [snapshot]);

  const grouping = snapshot.grouping;
  const companies = snapshot.companies;

  return {
    grouping,
    companies,
    snapshot,
    comparisonScope,
    setComparisonScope,
    setGrouping: (nextGrouping: GroupingMode) =>
      setSnapshot((current) => ({ ...current, grouping: nextGrouping })),
    groupedCompanies: useMemo(() => getGroupedCompanies(companies, grouping), [companies, grouping]),
    archivedCompanies: useMemo(() => getArchivedCompanies(companies), [companies]),
    negotiationSuggestionProcessIds: useMemo(
      () => getNegotiationSuggestionProcessIds(companies),
      [companies]
    ),
    offerComparisonRows: useMemo(
      () => getOfferComparisonRows(companies, comparisonScope),
      [companies, comparisonScope]
    ),
    upcomingInterviews: useMemo(() => getUpcomingInterviews(companies, new Date()), [companies]),
    updateCompanySummary: (companyId: string, patch: CompanySummaryPatch) =>
      setSnapshot((current) => ({
        ...current,
        companies: updateCompanySummary(current.companies, companyId, patch)
      })),
    addRoundToProcess: (companyId: string, processId: string) =>
      setSnapshot((current) => ({
        ...current,
        companies: addRoundToProcess(current.companies, companyId, processId)
      })),
    startNegotiation: (companyId: string, processId: string) =>
      setSnapshot((current) => ({
        ...current,
        companies: startNegotiation(current.companies, companyId, processId)
      })),
    saveNegotiationSnapshot: (
      companyId: string,
      draft: Omit<NegotiationSnapshot, "id" | "version" | "createdAt">
    ) =>
      setSnapshot((current) => ({
        ...current,
        companies: saveNegotiationSnapshot(current.companies, companyId, draft)
      })),
    deleteNegotiationSnapshot: (companyId: string, snapshotId: string) =>
      setSnapshot((current) => ({
        ...current,
        companies: deleteNegotiationSnapshot(current.companies, companyId, snapshotId)
      })),
    finishNegotiation: (
      companyId: string,
      status: Extract<NegotiationStatus, "accepted" | "declined" | "terminated">
    ) =>
      setSnapshot((current) => ({
        ...current,
        companies: finishNegotiation(current.companies, companyId, status)
      })),
    archiveProcessById: (companyId: string, processId: string, archiveNote: string) =>
      setSnapshot((current) => ({
        ...current,
        companies: archiveProcessById(current.companies, companyId, processId, archiveNote)
      })),
    updateProcessRecord: (
      companyId: string,
      processId: string,
      patch: Partial<Pick<InterviewProcess, "roleName">>
    ) =>
      setSnapshot((current) => ({
        ...current,
        companies: updateProcessRecord(current.companies, companyId, processId, patch)
      })),
    updateRoundRecord: (
      companyId: string,
      processId: string,
      roundId: string,
      patch: Partial<RoundRecord>
    ) =>
      setSnapshot((current) => ({
        ...current,
        companies: updateRoundRecord(current.companies, companyId, processId, roundId, patch)
      })),
    createCompanyWithProcess: (draft: NewCompanyDraft) =>
      setSnapshot((current) => ({
        ...current,
        companies: createCompanyWithProcess(current.companies, draft)
      })),
    resetWorkbench: () => setSnapshot(createEmptyWorkbenchSnapshot()),
    importWorkbenchSnapshot: (raw: string) => {
      const result = parseWorkbenchSnapshotImport(raw);

      if (result.ok) {
        setSnapshot(result.snapshot);
      }

      return result;
    }
  };
}
