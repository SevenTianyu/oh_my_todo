import { useState } from "react";
import type { CompanyRecord, InterviewProcess, RoundRecord } from "../types/interview";

type CompanySummaryPatch = Partial<
  Pick<CompanyRecord, "overallImpression" | "highlights" | "risks" | "priority">
>;

interface CompanyCardProps {
  company: CompanyRecord;
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

function ActiveProcess({
  process,
  company,
  onAddRound,
  onArchiveProcess,
  onUpdateRound
}: {
  process: InterviewProcess;
  company: CompanyRecord;
  onAddRound: CompanyCardProps["onAddRound"];
  onArchiveProcess: CompanyCardProps["onArchiveProcess"];
  onUpdateRound: CompanyCardProps["onUpdateRound"];
}) {
  return (
    <section style={{ marginTop: 16 }}>
      <h4>{process.roleName}</h4>
      <button type="button" onClick={() => onAddRound(company.id, process.id)}>
        新增轮次
      </button>
      <button type="button" onClick={() => onArchiveProcess(company.id, process.id)}>
        归档流程
      </button>

      {process.rounds.map((round) => (
        <div key={round.id} style={{ marginTop: 12 }}>
          <strong>{round.name}</strong>
          <input
            aria-label={`${company.name}-${round.name}-时间`}
            type="datetime-local"
            value={round.scheduledAt ?? ""}
            onChange={(event) =>
              onUpdateRound(company.id, process.id, round.id, { scheduledAt: event.target.value })
            }
          />
          <textarea
            aria-label={`${company.name}-${round.name}-备注`}
            value={round.notes}
            onChange={(event) =>
              onUpdateRound(company.id, process.id, round.id, { notes: event.target.value })
            }
          />
        </div>
      ))}
    </section>
  );
}

export function CompanyCard(props: CompanyCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [impressionDraft, setImpressionDraft] = useState(props.company.overallImpression);

  return (
    <article className="company-card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <strong>{props.company.name}</strong>
          <div>{props.company.highlights}</div>
          <div>{props.company.risks}</div>
        </div>

        <button
          type="button"
          aria-label={`${expanded ? "收起" : "展开"} ${props.company.name}`}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "收起" : "展开"}
        </button>
      </div>

      {expanded ? (
        <div style={{ marginTop: 16 }}>
          <label>
            公司整体印象
            <textarea
              aria-label="公司整体印象"
              value={impressionDraft}
              onChange={(event) => setImpressionDraft(event.target.value)}
            />
          </label>

          <button
            type="button"
            onClick={() =>
              props.onSaveSummary(props.company.id, {
                overallImpression: impressionDraft
              })
            }
          >
            保存公司判断
          </button>

          {props.company.processes
            .filter((process) => process.status === "active")
            .map((process) => (
              <ActiveProcess
                key={process.id}
                process={process}
                company={props.company}
                onAddRound={props.onAddRound}
                onArchiveProcess={props.onArchiveProcess}
                onUpdateRound={props.onUpdateRound}
              />
            ))}
        </div>
      ) : null}
    </article>
  );
}
