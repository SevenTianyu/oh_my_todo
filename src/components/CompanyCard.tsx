import { useEffect, useState } from "react";
import type { CompanyRecord, InterviewProcess, RoundRecord } from "../types/interview";

const COMPANY_TYPE_LABELS = {
  startup: "创业公司",
  "big-tech": "大厂"
} as const;

const PRIORITY_LABELS = {
  high: "高优先级",
  medium: "中优先级",
  low: "低优先级"
} as const;

const STAGE_LABELS = {
  screening: "流程筛选",
  interviewing: "面试推进",
  offer: "Offer 阶段",
  closed: "流程结束"
} as const;

const ROUND_STATUS_LABELS = {
  pending: "待安排",
  scheduled: "已排期",
  completed: "已完成",
  "waiting-result": "等结果",
  closed: "已结束"
} as const;

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
      <div className="company-card__process-header">
        <div className="company-card__process-copy">
          <h4 className="company-card__process-title">{process.roleName}</h4>
          <div className="company-card__process-meta">
            <span className="badge badge--stage">{STAGE_LABELS[process.stage]}</span>
            <span className="company-card__process-next">下一步：{process.nextStep}</span>
          </div>
        </div>

        <div className="company-card__process-actions">
          <button
            className="button button--secondary"
            type="button"
            onClick={() => onAddRound(company.id, process.id)}
          >
            新增轮次
          </button>
          <button
            className="button button--ghost"
            type="button"
            onClick={() => onArchiveProcess(company.id, process.id)}
          >
            归档流程
          </button>
        </div>
      </div>

      {process.rounds.map((round) => (
        <div className="company-card__round-row" key={round.id}>
          <div className="company-card__round-heading">
            <strong className="company-card__round-label">{round.name}</strong>
            <span className={`badge badge--round badge--round-${round.status}`}>
              {ROUND_STATUS_LABELS[round.status]}
            </span>
          </div>
          <input
            className="field field--input company-card__datetime"
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
            className="field field--textarea company-card__notes"
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
          <div className="company-card__badges">
            <span className={`badge badge--company-type badge--company-type-${props.company.companyType}`}>
              {COMPANY_TYPE_LABELS[props.company.companyType]}
            </span>
            <span className={`badge badge--priority badge--priority-${props.company.priority}`}>
              {PRIORITY_LABELS[props.company.priority]}
            </span>
          </div>

          <strong className="company-card__name">{props.company.name}</strong>
          <div className="company-card__summary-lines">
            <div className="company-card__summary-item">
              <span>亮点</span>
              <p>{props.company.highlights}</p>
            </div>
            <div className="company-card__summary-item">
              <span>风险</span>
              <p>{props.company.risks}</p>
            </div>
          </div>
        </div>

        <button
          className="button button--ghost company-card__toggle"
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
              className="field field--textarea company-card__notes"
              id={`company-impression-${props.company.id}`}
              aria-label="公司整体印象"
              value={impressionDraft}
              onChange={(event) => setImpressionDraft(event.target.value)}
            />

            <button
              className="button button--primary company-card__summary-action"
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
