import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { TextareaHTMLAttributes } from "react";
import type {
  CompanyCategory,
  CompanyRecord,
  InterviewProcess,
  NegotiationSnapshot,
  NegotiationStatus,
  RoundRecord
} from "../types/interview";
import { getLatestNegotiationSnapshot } from "../lib/compensation";
import { getRoundStatusLabel, resolveAppLocale, type AppLocale } from "../lib/locale";
import { NegotiationSection } from "./NegotiationSection";

type CompanySummaryPatch = Partial<
  Pick<CompanyRecord, "name" | "companyType" | "overallImpression">
>;

interface CompanyCardProps {
  company: CompanyRecord;
  companyCategories: CompanyCategory[];
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

function getCompanyCardCopy(locale: AppLocale) {
  return locale === "en"
    ? {
        negotiationFallbackRole: "Negotiation Record",
        overallJudgment: "Overall Judgment",
        companyJudgmentTitle: "Company Judgment",
        interviewScheduleTitle: "Interview Schedule",
        expand: "Expand",
        collapse: "Collapse",
        expandCompanyJudgmentAria: "Expand Company Judgment",
        collapseCompanyJudgmentAria: "Collapse Company Judgment",
        expandInterviewScheduleAria: "Expand Interview Schedule",
        collapseInterviewScheduleAria: "Collapse Interview Schedule",
        companyName: "Company Name",
        companyType: "Company Type",
        overallImpression: "Overall Impression",
        saveCompanyJudgment: "Save Company Judgment",
        saveInterviewSchedule: "Save Interview Schedule",
        editRoleName: (roleName: string) => `Edit role name ${roleName}`,
        cancelRoleName: "Cancel role name edit",
        saveRoleName: "Save role name",
        roleName: "Role Name",
        nextStep: (value: string) => `Next: ${value}`,
        addRound: "Add Round",
        archiveProcess: "Archive Process",
        archiveDialogTitle: "Archive Process Note",
        archiveDialogDescription:
          "Write a brief note so the archived card remembers why this process was closed out.",
        archiveNoteLabel: "Archive Note",
        archiveNotePlaceholder: "For example: Pausing in favor of a better-matched path.",
        cancelArchiveProcess: "Cancel",
        confirmArchiveProcess: "Confirm Archive",
        editRoundName: (roundName: string) => `Edit interview name ${roundName}`,
        cancelRoundName: "Cancel interview name edit",
        saveRoundName: "Save interview name",
        roundName: "Interview Name",
        timeLabel: (companyName: string, roundName: string) => `${companyName}-${roundName}-Time`,
        notesLabel: (companyName: string, roundName: string) => `${companyName}-${roundName}-Notes`
      }
    : {
        negotiationFallbackRole: "谈薪档案",
        overallJudgment: "整体判断",
        companyJudgmentTitle: "公司判断",
        interviewScheduleTitle: "面试安排",
        expand: "展开",
        collapse: "收起",
        expandCompanyJudgmentAria: "展开公司判断",
        collapseCompanyJudgmentAria: "收起公司判断",
        expandInterviewScheduleAria: "展开面试安排",
        collapseInterviewScheduleAria: "收起面试安排",
        companyName: "公司名称",
        companyType: "公司类型",
        overallImpression: "公司整体印象",
        saveCompanyJudgment: "保存公司判断",
        saveInterviewSchedule: "保存面试安排",
        editRoleName: (roleName: string) => `编辑岗位名称 ${roleName}`,
        cancelRoleName: "取消岗位名称修改",
        saveRoleName: "保存岗位名称",
        roleName: "岗位名称",
        nextStep: (value: string) => `下一步：${value}`,
        addRound: "新增轮次",
        archiveProcess: "归档流程",
        archiveDialogTitle: "归档流程说明",
        archiveDialogDescription: "写一句简短说明，记录为什么把这个流程归档到底部历史记录里。",
        archiveNoteLabel: "归档说明",
        archiveNotePlaceholder: "例如：优先推进其他更匹配的机会",
        cancelArchiveProcess: "取消",
        confirmArchiveProcess: "确认归档",
        editRoundName: (roundName: string) => `编辑面试名称 ${roundName}`,
        cancelRoundName: "取消面试名称修改",
        saveRoundName: "保存面试名称",
        roundName: "面试名称",
        timeLabel: (companyName: string, roundName: string) => `${companyName}-${roundName}-时间`,
        notesLabel: (companyName: string, roundName: string) => `${companyName}-${roundName}-备注`
      };
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

function getInterviewImpressionLines(company: CompanyRecord, locale: AppLocale) {
  return company.processes.flatMap((process) =>
    process.rounds.flatMap((round) => {
      const notes = round.notes.trim();
      if (!notes) return [];

      const scheduledDate = round.scheduledAt?.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
      const separator = locale === "en" ? ": " : "：";
      return [scheduledDate ? `${scheduledDate} ${round.name}${separator}${notes}` : `${round.name}${separator}${notes}`];
    })
  );
}

function getCompanyImpressionPreview(company: CompanyRecord, locale: AppLocale) {
  return [company.overallImpression.trim(), ...getInterviewImpressionLines(company, locale)]
    .filter(Boolean)
    .join("\n");
}

function getCompanyMastheadRole(company: CompanyRecord, copy: ReturnType<typeof getCompanyCardCopy>) {
  const activeProcesses = company.processes.filter((process) => process.status === "active");
  if (activeProcesses.length > 0) {
    return activeProcesses.map((process) => process.roleName).join(" · ");
  }

  const latestSnapshot = getLatestNegotiationSnapshot(company.negotiation);
  const sourceProcess = company.processes.find(
    (process) => process.id === company.negotiation.sourceProcessId
  );

  return latestSnapshot?.title || sourceProcess?.roleName || copy.negotiationFallbackRole;
}

function RoundEditor({
  round,
  company,
  process,
  onUpdateRound,
  locale,
  copy
}: {
  round: RoundRecord;
  company: CompanyRecord;
  process: InterviewProcess;
  onUpdateRound: CompanyCardProps["onUpdateRound"];
  locale: AppLocale;
  copy: ReturnType<typeof getCompanyCardCopy>;
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
              aria-label={copy.roundName}
              className="field field--input company-card__text company-card__round-title-input"
              value={roundNameDraft}
              onChange={(event) => setRoundNameDraft(event.target.value)}
            />
            <button
              aria-label={copy.cancelRoundName}
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
              aria-label={copy.saveRoundName}
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
            aria-label={copy.editRoundName(round.name)}
            className="company-card__round-title-button"
            type="button"
            onClick={() => setIsEditingRoundName(true)}
          >
            <strong className="company-card__round-label">{round.name}</strong>
          </button>
        )}
        <span className={`badge badge--round badge--round-${round.status}`}>
          {getRoundStatusLabel(locale, round.status)}
        </span>
      </div>
      <input
        className="field field--input company-card__datetime"
        aria-label={copy.timeLabel(company.name, round.name)}
        type="datetime-local"
        value={toDateTimeLocalValue(round.scheduledAt)}
        onChange={(event) =>
          onUpdateRound(company.id, process.id, round.id, getScheduledAtPatch(round, event.target.value))
        }
      />
      <AutosizeTextarea
        className="field field--textarea company-card__notes"
        aria-label={copy.notesLabel(company.name, round.name)}
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
  onUpdateRound,
  locale,
  copy
}: {
  process: InterviewProcess;
  company: CompanyRecord;
  onAddRound: CompanyCardProps["onAddRound"];
  onArchiveProcess: CompanyCardProps["onArchiveProcess"];
  onUpdateProcess: CompanyCardProps["onUpdateProcess"];
  onUpdateRound: CompanyCardProps["onUpdateRound"];
  locale: AppLocale;
  copy: ReturnType<typeof getCompanyCardCopy>;
}) {
  const [isEditingRoleName, setIsEditingRoleName] = useState(false);
  const [roleNameDraft, setRoleNameDraft] = useState(process.roleName);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiveNoteDraft, setArchiveNoteDraft] = useState("");

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
                aria-label={copy.roleName}
                className="field field--input company-card__text company-card__process-title-input"
                value={roleNameDraft}
                onChange={(event) => setRoleNameDraft(event.target.value)}
              />
              <button
                aria-label={copy.cancelRoleName}
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
                aria-label={copy.saveRoleName}
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
              aria-label={copy.editRoleName(process.roleName)}
              className="company-card__process-title-button"
              type="button"
              onClick={() => setIsEditingRoleName(true)}
            >
              <h4 className="company-card__process-title">{process.roleName}</h4>
            </button>
          )}
          <div className="company-card__process-meta">
            <span className="company-card__process-next">{copy.nextStep(process.nextStep)}</span>
          </div>
        </div>

        <div className="company-card__process-actions">
          <button
            className="button button--secondary"
            type="button"
            onClick={() => onAddRound(company.id, process.id)}
          >
            {copy.addRound}
          </button>
          <button
            className="button button--ghost"
            type="button"
            onClick={() => {
              setArchiveNoteDraft(process.archiveNote ?? "");
              setArchiveDialogOpen(true);
            }}
          >
            {copy.archiveProcess}
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
          locale={locale}
          copy={copy}
        />
      ))}

      {archiveDialogOpen ? (
        <div className="company-card__dialog-backdrop" role="presentation">
          <div
            aria-label={copy.archiveDialogTitle}
            aria-modal="true"
            className="company-card__dialog"
            role="dialog"
          >
            <div className="company-card__dialog-copy">
              <h5 className="company-card__dialog-title">{copy.archiveDialogTitle}</h5>
              <p className="company-card__dialog-description">{copy.archiveDialogDescription}</p>
            </div>

            <label className="company-card__negotiation-field">
              <span>{copy.archiveNoteLabel}</span>
              <AutosizeTextarea
                aria-label={copy.archiveNoteLabel}
                className="field field--textarea company-card__notes"
                placeholder={copy.archiveNotePlaceholder}
                value={archiveNoteDraft}
                onChange={(event) => setArchiveNoteDraft(event.target.value)}
              />
            </label>

            <div className="company-card__dialog-actions">
              <button
                className="button button--ghost"
                type="button"
                onClick={() => {
                  setArchiveDialogOpen(false);
                  setArchiveNoteDraft(process.archiveNote ?? "");
                }}
              >
                {copy.cancelArchiveProcess}
              </button>
              <button
                className="button button--secondary"
                type="button"
                disabled={!archiveNoteDraft.trim()}
                onClick={() => {
                  onArchiveProcess(company.id, process.id, archiveNoteDraft.trim());
                  setArchiveDialogOpen(false);
                  setArchiveNoteDraft("");
                }}
              >
                {copy.confirmArchiveProcess}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function CompanyCard(props: CompanyCardProps) {
  const locale = resolveAppLocale();
  const copy = getCompanyCardCopy(locale);
  const sortedCompanyCategories = [...props.companyCategories].sort(
    (left, right) => left.order - right.order || left.name.localeCompare(right.name)
  );
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
  const mastheadRole = getCompanyMastheadRole(props.company, copy);

  return (
    <article className="company-card">
      <header className="company-card__masthead">
        <div className="company-card__mastcopy">
          <h3 className="company-card__name">{props.company.name}</h3>
          <p className="company-card__role">{mastheadRole}</p>
          <div className="company-card__summary-lines">
            <div className="company-card__summary-item">
              <span>{copy.overallJudgment}</span>
              <p>{getCompanyImpressionPreview(props.company, locale)}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="company-card__details">
        <section className="company-card__section">
          <div className="company-card__section-header">
            <h4 className="company-card__section-title">{copy.companyJudgmentTitle}</h4>
            <button
              className="button button--ghost"
              type="button"
              aria-label={
                summaryExpanded ? copy.collapseCompanyJudgmentAria : copy.expandCompanyJudgmentAria
              }
              onClick={() => setSummaryExpanded((value) => !value)}
            >
              {summaryExpanded ? copy.collapse : copy.expand}
            </button>
          </div>

          {summaryExpanded ? (
            <>
              <div className="company-card__summary-row">
                <label className="company-card__field-label" htmlFor={`company-name-${props.company.id}`}>
                  {copy.companyName}
                </label>
                <input
                  className="field field--input company-card__text"
                  id={`company-name-${props.company.id}`}
                  aria-label={copy.companyName}
                  value={summaryDraft.name}
                  onChange={(event) =>
                    setSummaryDraft((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </div>

              <div className="company-card__summary-row">
                <label className="company-card__field-label" htmlFor={`company-type-${props.company.id}`}>
                  {copy.companyType}
                </label>
                <select
                  className="field company-card__text"
                  id={`company-type-${props.company.id}`}
                  aria-label={copy.companyType}
                  value={summaryDraft.companyType}
                  onChange={(event) =>
                    setSummaryDraft((current) => ({
                      ...current,
                      companyType: event.target.value as CompanyRecord["companyType"]
                    }))
                  }
                >
                  {sortedCompanyCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="company-card__summary-row">
                <label className="company-card__field-label" htmlFor={`company-impression-${props.company.id}`}>
                  {copy.overallImpression}
                </label>
                <AutosizeTextarea
                  className="field field--textarea company-card__notes"
                  id={`company-impression-${props.company.id}`}
                  aria-label={copy.overallImpression}
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
                  {copy.saveCompanyJudgment}
                </button>
              </div>
            </>
          ) : null}
        </section>

        <section className="company-card__section">
          <div className="company-card__section-header">
            <h4 className="company-card__section-title">{copy.interviewScheduleTitle}</h4>
            <button
              className="button button--ghost"
              type="button"
              aria-label={
                interviewExpanded ? copy.collapseInterviewScheduleAria : copy.expandInterviewScheduleAria
              }
              onClick={() => setInterviewExpanded((value) => !value)}
            >
              {interviewExpanded ? copy.collapse : copy.expand}
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
                    locale={locale}
                    copy={copy}
                  />
                ))}

              <div className="company-card__details-actions">
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => setInterviewExpanded(false)}
                >
                  {copy.saveInterviewSchedule}
                </button>
              </div>
            </>
          ) : null}
        </section>

        <div className="company-card__negotiation-shell">
          <NegotiationSection
            company={props.company}
            suggestionProcessId={props.negotiationSuggestionProcessId}
            onStartNegotiation={props.onStartNegotiation}
            onSaveNegotiationSnapshot={props.onSaveNegotiationSnapshot}
            onDeleteNegotiationSnapshot={props.onDeleteNegotiationSnapshot}
            onFinishNegotiation={props.onFinishNegotiation}
          />
        </div>
      </div>
    </article>
  );
}
