import { useEffect, useState } from "react";
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

function toDateTimeLocalValue(value: string | null) {
  if (!value) return "";

  const match = value.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  return match ? match[1] : value;
}

function getScheduledAtPatch(round: RoundRecord, value: string): Partial<RoundRecord> {
  if (value === "") {
    return {
      scheduledAt: null,
      status: round.status === "scheduled" ? "pending" : round.status
    };
  }

  return {
    scheduledAt: value,
    status: "scheduled"
  };
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
    <section className="company-card__process">
      <h4 className="company-card__process-title">{process.roleName}</h4>
      <div className="company-card__process-actions">
        <button type="button" onClick={() => onAddRound(company.id, process.id)}>
          新增轮次
        </button>
        <button type="button" onClick={() => onArchiveProcess(company.id, process.id)}>
          归档流程
        </button>
      </div>

      {process.rounds.map((round) => (
        <div className="company-card__round-row" key={round.id}>
          <strong className="company-card__round-label">{round.name}</strong>
          <input
            className="company-card__datetime"
            aria-label={`${company.name}-${round.name}-时间`}
            type="datetime-local"
            value={toDateTimeLocalValue(round.scheduledAt)}
            onChange={(event) =>
              onUpdateRound(
                company.id,
                process.id,
                round.id,
                getScheduledAtPatch(round, event.target.value)
              )
            }
          />
          <textarea
            className="company-card__notes"
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

  useEffect(() => {
    setImpressionDraft(props.company.overallImpression);
  }, [props.company.id, props.company.overallImpression]);

  return (
    <article className="company-card">
      <div className="company-card__header">
        <div className="company-card__summary">
          <strong className="company-card__name">{props.company.name}</strong>
          <div>{props.company.highlights}</div>
          <div>{props.company.risks}</div>
        </div>

        <button
          className="company-card__toggle"
          type="button"
          aria-label={`${expanded ? "收起" : "展开"} ${props.company.name}`}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "收起" : "展开"}
        </button>
      </div>

      {expanded ? (
        <div className="company-card__details">
          <div className="company-card__summary-row">
            <label className="company-card__field-label" htmlFor={`company-impression-${props.company.id}`}>
              公司整体印象
            </label>
            <textarea
              className="company-card__notes"
              id={`company-impression-${props.company.id}`}
              aria-label="公司整体印象"
              value={impressionDraft}
              onChange={(event) => setImpressionDraft(event.target.value)}
            />

          <button
            className="company-card__summary-action"
            type="button"
            onClick={() =>
              props.onSaveSummary(props.company.id, {
                overallImpression: impressionDraft
              })
            }
          >
            保存公司判断
          </button>
          </div>

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
