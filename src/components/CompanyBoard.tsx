import { CompanyCard } from "./CompanyCard";
import type { CompanyGroup, CompanyRecord, RoundRecord } from "../types/interview";

type CompanySummaryPatch = Partial<
  Pick<CompanyRecord, "overallImpression" | "highlights" | "risks" | "priority">
>;

interface CompanyBoardProps {
  groups: CompanyGroup[];
  onSaveSummary: (companyId: string, patch: CompanySummaryPatch) => void;
  onAddRound: (companyId: string, processId: string) => void;
  onArchiveProcess: (companyId: string, processId: string) => void;
  onUpdateRound: (
    companyId: string,
    processId: string,
    roundId: string,
    patch: Partial<RoundRecord>
  ) => void;
}

export function CompanyBoard({
  groups,
  onSaveSummary,
  onAddRound,
  onArchiveProcess,
  onUpdateRound
}: CompanyBoardProps) {
  return (
    <section className="board-grid">
      {groups.map((group) => (
        <div className="panel" key={group.key}>
          <h3>{group.label}</h3>
          {group.companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onSaveSummary={onSaveSummary}
              onAddRound={onAddRound}
              onArchiveProcess={onArchiveProcess}
              onUpdateRound={onUpdateRound}
            />
          ))}
        </div>
      ))}
    </section>
  );
}
