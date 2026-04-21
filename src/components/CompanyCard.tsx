import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { TextareaHTMLAttributes } from "react";
import type {
  CompanyRecord,
  InterviewProcess,
  NegotiationSnapshot,
  NegotiationStatus,
  RoundRecord
} from "../types/interview";
import { NegotiationSection } from "./NegotiationSection";

const COMPANY_TYPE_LABELS = {
  startup: "创业公司",
  "big-tech": "大厂"
} as const;

const ROUND_STATUS_LABELS = {
  pending: "待安排",
  scheduled: "已排期",
  completed: "已完成",
  "waiting-result": "等结果",
  closed: "已结束"
} as const;

type CompanySummaryPatch = Partial<
  Pick<CompanyRecord, "name" | "companyType" | "overallImpression">
>;

interface CompanyCardProps {
  company: CompanyRecord;
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
  negotiationSuggestionProcessId?: string | null;
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

function AutosizeTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { className, value, ...restProps } = props;

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      {...restProps}
      ref={textareaRef}
      className={className}
      value={value}
      rows={1}
    />
  );
}

function getInterviewImpressionLines(company: CompanyRecord) {
  return company.processes.flatMap((process) =>
    process.rounds.flatMap((round) => {
      const notes = round.notes.trim();
      if (!notes) return [];

      const scheduledDate = round.scheduledAt?.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
      return [scheduledDate ? `${scheduledDate} ${round.name}：${notes}` : `${round.name}：${notes}`];
    })
  );
}

function getCompanyImpressionPreview(company: CompanyRecord) {
  return [company.overallImpression.trim(), ...getInterviewImpressionLines(company)]
    .filter(Boolean)
    .join("\n");
}

function RoundEditor({
  round,
  company,
  process,
  onUpdateRound
}: {
  round: RoundRecord;
  company: CompanyRecord;
  process: InterviewProcess;
  onUpdateRound: CompanyCardProps["onUpdateRound"];
}) {
  const [isEditingRoundName, setIsEditingRoundName] = useState(false);
  const [roundNameDraft, setRoundNameDraft] = useState(round.name);

  useEffect(() => {
    setRoundNameDraft(round.name);
    setIsEditingRoundName(false);
  }, [round.id, round.name]);

  return (
    <div className="company-card__round-row">
      <div className="company-card__round-heading">
        {isEditingRoundName ? (
          <div className="company-card__round-title-editor">
            <input
              aria-label="面试名称"
              className="field field--input company-card__text company-card__round-title-input"
              value={roundNameDraft}
              onChange={(event) => setRoundNameDraft(event.target.value)}
            />
            <button
              aria-label="取消面试名称修改"
              className="button button--ghost company-card__icon-button"
              type="button"
              onClick={() => {
                setRoundNameDraft(round.name);
                setIsEditingRoundName(false);
              }}
            >
              ×
            </button>
            <button
              aria-label="保存面试名称"
              className="button button--secondary company-card__icon-button"
              type="button"
              onClick={() => {
                const nextRoundName = roundNameDraft.trim();
                if (!nextRoundName) {
                  setRoundNameDraft(round.name);
                  setIsEditingRoundName(false);
                  return;
                }

                onUpdateRound(company.id, process.id, round.id, { name: nextRoundName });
                setIsEditingRoundName(false);
              }}
            >
              ✓
            </button>
          </div>
        ) : (
          <button
            aria-label={`编辑面试名称 ${round.name}`}
            className="company-card__round-title-button"
            type="button"
            onClick={() => setIsEditingRoundName(true)}
          >
            <strong className="company-card__round-label">{round.name}</strong>
          </button>
        )}
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
          onUpdateRound(company.id, process.id, round.id, getScheduledAtPatch(round, event.target.value))
        }
      />
      <AutosizeTextarea
        className="field field--textarea company-card__notes"
        aria-label={`${company.name}-${round.name}-备注`}
        value={round.notes}
        onChange={(event) =>
          onUpdateRound(company.id, process.id, round.id, { notes: event.target.value })
        }
      />
    </div>
  );
}

function ActiveProcess({
  process,
  company,
  onAddRound,
  onArchiveProcess,
  onUpdateProcess,
  onUpdateRound
}: {
  process: InterviewProcess;
  company: CompanyRecord;
  onAddRound: CompanyCardProps["onAddRound"];
  onArchiveProcess: CompanyCardProps["onArchiveProcess"];
  onUpdateProcess: CompanyCardProps["onUpdateProcess"];
  onUpdateRound: CompanyCardProps["onUpdateRound"];
}) {
  const [isEditingRoleName, setIsEditingRoleName] = useState(false);
  const [roleNameDraft, setRoleNameDraft] = useState(process.roleName);

  useEffect(() => {
    setRoleNameDraft(process.roleName);
    setIsEditingRoleName(false);
  }, [process.id, process.roleName]);

  return (
    <section className="company-card__process">
      <div className="company-card__process-header">
        <div className="company-card__process-copy">
          {isEditingRoleName ? (
            <div className="company-card__process-title-editor">
              <input
                aria-label="岗位名称"
                className="field field--input company-card__text company-card__process-title-input"
                value={roleNameDraft}
                onChange={(event) => setRoleNameDraft(event.target.value)}
              />
              <button
                aria-label="取消岗位名称修改"
                className="button button--ghost company-card__icon-button"
                type="button"
                onClick={() => {
                  setRoleNameDraft(process.roleName);
                  setIsEditingRoleName(false);
                }}
              >
                ×
              </button>
              <button
                aria-label="保存岗位名称"
                className="button button--secondary company-card__icon-button"
                type="button"
                onClick={() => {
                  const nextRoleName = roleNameDraft.trim();
                  if (!nextRoleName) {
                    setRoleNameDraft(process.roleName);
                    setIsEditingRoleName(false);
                    return;
                  }

                  onUpdateProcess(company.id, process.id, { roleName: nextRoleName });
                  setIsEditingRoleName(false);
                }}
              >
                ✓
              </button>
            </div>
          ) : (
            <button
              aria-label={`编辑岗位名称 ${process.roleName}`}
              className="company-card__process-title-button"
              type="button"
              onClick={() => setIsEditingRoleName(true)}
            >
              <h4 className="company-card__process-title">{process.roleName}</h4>
            </button>
          )}
          <div className="company-card__process-meta">
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
        <RoundEditor
          key={round.id}
          round={round}
          company={company}
          process={process}
          onUpdateRound={onUpdateRound}
        />
      ))}
    </section>
  );
}

export function CompanyCard(props: CompanyCardProps) {
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [interviewExpanded, setInterviewExpanded] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState({
    name: props.company.name,
    companyType: props.company.companyType,
    overallImpression: props.company.overallImpression
  });

  useEffect(() => {
    setSummaryDraft({
      name: props.company.name,
      companyType: props.company.companyType,
      overallImpression: props.company.overallImpression
    });
  }, [
    props.company.id,
    props.company.name,
    props.company.companyType,
    props.company.overallImpression
  ]);

  return (
    <article className="company-card">
      <div className="company-card__header">
        <div className="company-card__summary">
          <div className="company-card__badges">
            <span className={`badge badge--company-type badge--company-type-${props.company.companyType}`}>
              {COMPANY_TYPE_LABELS[props.company.companyType]}
            </span>
          </div>

          <strong className="company-card__name">{props.company.name}</strong>
          <div className="company-card__summary-lines">
            <div className="company-card__summary-item">
              <span>整体印象</span>
              <p>{getCompanyImpressionPreview(props.company)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="company-card__details">
        <section className="company-card__section">
          <div className="company-card__section-header">
            <h4 className="company-card__section-title">公司判断</h4>
            <button
              className="button button--ghost"
              type="button"
              aria-label={`${summaryExpanded ? "收起" : "展开"}公司判断`}
              onClick={() => setSummaryExpanded((value) => !value)}
            >
              {summaryExpanded ? "收起" : "展开"}
            </button>
          </div>

          {summaryExpanded ? (
            <>
              <div className="company-card__summary-row">
                <label className="company-card__field-label" htmlFor={`company-name-${props.company.id}`}>
                  公司名称
                </label>
                <input
                  className="field field--input company-card__text"
                  id={`company-name-${props.company.id}`}
                  aria-label="公司名称"
                  value={summaryDraft.name}
                  onChange={(event) =>
                    setSummaryDraft((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </div>

              <div className="company-card__summary-row">
                <label className="company-card__field-label" htmlFor={`company-type-${props.company.id}`}>
                  公司类型
                </label>
                <select
                  className="field company-card__text"
                  id={`company-type-${props.company.id}`}
                  aria-label="公司类型"
                  value={summaryDraft.companyType}
                  onChange={(event) =>
                    setSummaryDraft((current) => ({
                      ...current,
                      companyType: event.target.value as CompanyRecord["companyType"]
                    }))
                  }
                >
                  <option value="startup">创业公司</option>
                  <option value="big-tech">大厂</option>
                </select>
              </div>

              <div className="company-card__summary-row">
                <label className="company-card__field-label" htmlFor={`company-impression-${props.company.id}`}>
                  公司整体印象
                </label>
                <AutosizeTextarea
                  className="field field--textarea company-card__notes"
                  id={`company-impression-${props.company.id}`}
                  aria-label="公司整体印象"
                  value={summaryDraft.overallImpression}
                  onChange={(event) =>
                    setSummaryDraft((current) => ({
                      ...current,
                      overallImpression: event.target.value
                    }))
                  }
                />

                <button
                  className="button button--primary company-card__summary-action"
                  type="button"
                  onClick={() => {
                    props.onSaveSummary(props.company.id, {
                      name: summaryDraft.name.trim(),
                      companyType: summaryDraft.companyType,
                      overallImpression: summaryDraft.overallImpression
                    });
                    setSummaryExpanded(false);
                  }}
                >
                  保存公司判断
                </button>
              </div>
            </>
          ) : null}
        </section>

        <section className="company-card__section">
          <div className="company-card__section-header">
            <h4 className="company-card__section-title">面试安排</h4>
            <button
              className="button button--ghost"
              type="button"
              aria-label={`${interviewExpanded ? "收起" : "展开"}面试安排`}
              onClick={() => setInterviewExpanded((value) => !value)}
            >
              {interviewExpanded ? "收起" : "展开"}
            </button>
          </div>

          {interviewExpanded ? (
            <>
              {props.company.processes
                .filter((process) => process.status === "active")
                .map((process) => (
                  <ActiveProcess
                    key={process.id}
                    process={process}
                    company={props.company}
                    onAddRound={props.onAddRound}
                    onArchiveProcess={props.onArchiveProcess}
                    onUpdateProcess={props.onUpdateProcess}
                    onUpdateRound={props.onUpdateRound}
                  />
                ))}

              <div className="company-card__details-actions">
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => setInterviewExpanded(false)}
                >
                  保存面试安排
                </button>
              </div>
            </>
          ) : null}
        </section>

        <NegotiationSection
          company={props.company}
          suggestionProcessId={props.negotiationSuggestionProcessId}
          onStartNegotiation={props.onStartNegotiation}
          onSaveNegotiationSnapshot={props.onSaveNegotiationSnapshot}
          onDeleteNegotiationSnapshot={props.onDeleteNegotiationSnapshot}
          onFinishNegotiation={props.onFinishNegotiation}
        />
      </div>
    </article>
  );
}
