import { CompanyCard } from "./CompanyCard";
import type {
  CompanyGroup,
  CompanyRecord,
  InterviewProcess,
  NegotiationSnapshot,
  NegotiationStatus,
  RoundRecord
} from "../types/interview";

type CompanySummaryPatch = Partial<Pick<CompanyRecord, "name" | "companyType" | "overallImpression">>;

interface CompanyBoardProps {
  groups: CompanyGroup[];
  onSaveSummary: (companyId: string, patch: CompanySummaryPatch) => void;
  onAddRound: (companyId: string, processId: string) => void;
  onArchiveProcess: (companyId: string, processId: string) => void;
  onUpdateProcess: (
    companyId: string,
    processId: string,
    patch: Partial<Pick<InterviewProcess, "roleName">>
  ) => void;
  onUpdateRound: (
    companyId: string,
    processId: string,
    roundId: string,
    patch: Partial<RoundRecord>
  ) => void;
  negotiationSuggestionProcessIds?: Partial<Record<string, string | null>>;
  onStartNegotiation?: (companyId: string, processId: string) => void;
  onSaveNegotiationSnapshot?: (
    companyId: string,
    draft: Omit<NegotiationSnapshot, "id" | "version" | "createdAt">
  ) => void;
  onFinishNegotiation?: (
    companyId: string,
    status: Extract<NegotiationStatus, "accepted" | "declined" | "terminated">
  ) => void;
}

export function CompanyBoard({
  groups,
  onSaveSummary,
  onAddRound,
  onArchiveProcess,
  onUpdateProcess,
  onUpdateRound,
  negotiationSuggestionProcessIds,
  onStartNegotiation,
  onSaveNegotiationSnapshot,
  onFinishNegotiation
}: CompanyBoardProps) {
  return (
    <section className="board-grid">
      {groups.map((group) => (
        <section className="panel panel--group" key={group.key}>
          <div className="group-panel__header">
            <div>
              <p className="group-panel__eyebrow">Active Lane</p>
              <h3>{group.label}</h3>
            </div>
            <span className="group-panel__count">{group.companies.length}</span>
          </div>
          <div className="group-panel__stack">
            {group.companies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onSaveSummary={onSaveSummary}
                onAddRound={onAddRound}
                onArchiveProcess={onArchiveProcess}
                onUpdateProcess={onUpdateProcess}
                onUpdateRound={onUpdateRound}
                negotiationSuggestionProcessId={negotiationSuggestionProcessIds?.[company.id] ?? null}
                onStartNegotiation={onStartNegotiation}
                onSaveNegotiationSnapshot={onSaveNegotiationSnapshot}
                onFinishNegotiation={onFinishNegotiation}
              />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
