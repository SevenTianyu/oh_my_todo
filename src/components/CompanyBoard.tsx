import { CompanyCard } from "./CompanyCard";
import { resolveAppLocale } from "../lib/locale";
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
  onArchiveProcess: (companyId: string, processId: string, archiveNote: string) => void;
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
  onDeleteNegotiationSnapshot?: (companyId: string, snapshotId: string) => void;
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
  onDeleteNegotiationSnapshot,
  onFinishNegotiation
}: CompanyBoardProps) {
  const locale = resolveAppLocale();
  const copy =
    locale === "en"
      ? {
          caption: "dossiers"
        }
      : {
          caption: "份"
        };

  return (
    <section className="board-grid">
      {groups.map((group) => (
        <section className="panel panel--group" key={group.key}>
          <div className="group-panel__header">
            <h3>{group.label}</h3>
            <div className="group-panel__meta">
              <span className="group-panel__count">
                {String(group.companies.length).padStart(2, "0")}
              </span>
              <span className="group-panel__caption">{copy.caption}</span>
            </div>
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
                onDeleteNegotiationSnapshot={onDeleteNegotiationSnapshot}
                onFinishNegotiation={onFinishNegotiation}
              />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
