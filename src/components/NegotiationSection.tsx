import { useEffect, useState } from "react";
import { getLatestNegotiationSnapshot } from "../lib/compensation";
import {
  formatCashInputFromYuan,
  parseCashInputToYuan
} from "../lib/negotiationUnits";
import {
  formatLocalizedCashWithMonths,
  getTerminalNegotiationStatusLabel,
  resolveAppLocale,
  type AppLocale
} from "../lib/locale";
import type { CompanyRecord, NegotiationSnapshot, NegotiationStatus } from "../types/interview";

interface NegotiationSectionProps {
  company: CompanyRecord;
  suggestionProcessId?: string | null;
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

interface NegotiationFormState {
  title: string;
  level: string;
  city: string;
  workMode: string;
  baseMonthlySalary: string;
  salaryMonths: string;
  annualBonusCash: string;
  signOnBonus: string;
  relocationBonus: string;
  equityShares: string;
  equityPerShareValue: string;
  equityVestingYears: string;
  deadline: string;
  hrSignal: string;
  notes: string;
}

function getNegotiationCopy(locale: AppLocale) {
  return locale === "en"
    ? {
        title: "Negotiation",
        expandAria: "Expand Negotiation",
        collapseAria: "Collapse Negotiation",
        expand: "Expand",
        collapse: "Collapse",
        suggestedEntry:
          "Suggested: this process is already close to offer discussion and can move into negotiation.",
        manualEntry:
          "If you have started confirming quote, total package, or salary room with HR, you can enter negotiation manually.",
        enterNegotiation: "Enter Negotiation",
        latestSnapshot: "Latest Snapshot",
        currentStatus: "Current Status",
        negotiationEnded: "Negotiation is closed, and the history remains below.",
        formNote:
          "Cash fields are entered in units of 10k CNY. For example, enter 5.2 to represent CNY 52K per month. Equity fields use quantity multiplied by per-share value.",
        titleLabel: "Negotiation Title",
        levelLabel: "Level",
        cityLabel: "City",
        workModeLabel: "Work Mode",
        baseMonthlySalaryLabel: "Base Monthly Salary (10k CNY)",
        baseMonthlySalaryAria: "Base Monthly Salary",
        baseMonthlySalaryPlaceholder: "e.g. 5.2",
        salaryMonthsLabel: "Salary Months",
        salaryMonthsAria: "Salary Months",
        salaryMonthsPlaceholder: "e.g. 15",
        annualBonusLabel: "Annual Cash Bonus (10k CNY)",
        annualBonusAria: "Annual Cash Bonus",
        annualBonusPlaceholder: "e.g. 8",
        signOnBonusLabel: "Sign-on Bonus (10k CNY)",
        signOnBonusAria: "Sign-on Bonus",
        signOnBonusPlaceholder: "e.g. 3",
        relocationBonusLabel: "Relocation Bonus (10k CNY)",
        relocationBonusAria: "Relocation Bonus",
        relocationBonusPlaceholder: "e.g. 1",
        equitySharesLabel: "Equity Shares",
        equitySharesAria: "Equity Shares",
        equityPerShareValueLabel: "Per-share Value",
        equityPerShareValueAria: "Per-share Value",
        equityPerShareValuePlaceholder: "e.g. 18",
        equityVestingYearsLabel: "Vesting Years",
        equityVestingYearsAria: "Vesting Years",
        deadlineLabel: "Deadline",
        deadlineAria: "Deadline",
        hrSignalLabel: "HR Signal",
        hrSignalAria: "HR Signal",
        notesLabel: "Notes",
        notesAria: "Notes",
        saveSnapshot: "Save Negotiation Snapshot",
        markAccepted: "Mark as Accepted",
        markDeclined: "Mark as Declined",
        terminate: "Terminate Negotiation",
        linkedRole: (roleName: string) => `Linked Role: ${roleName}`,
        fallbackTitle: "Negotiation Snapshot",
        deleteConfirm: (version: number) =>
          `Delete negotiation round ${version}? This action cannot be undone.`,
        historyTitle: (version: number) => `Negotiation Round ${version}`,
        deleteSnapshotAria: (version: number) => `Delete negotiation round ${version}`,
        delete: "Delete",
        empty: "No negotiation snapshot saved yet.",
        tbd: "TBD"
      }
    : {
        title: "谈薪",
        expandAria: "展开谈薪",
        collapseAria: "收起谈薪",
        expand: "展开",
        collapse: "收起",
        suggestedEntry: "系统建议：这个流程已经接近报价沟通，可以进入谈薪。",
        manualEntry: "如果你已经开始和招聘方确认报价、总包或薪资空间，可以手动进入谈薪。",
        enterNegotiation: "确认进入谈薪",
        latestSnapshot: "最新快照",
        currentStatus: "当前状态",
        negotiationEnded: "谈薪已经结束，历史快照仍然保留在下方。",
        formNote:
          "现金字段统一按万元填写，例如月基本工资填 2.3 表示 2.3 万/月；股票/期权统一按数量乘每股估值填写，期权请先自行折算成每股估值。",
        titleLabel: "谈薪标题",
        levelLabel: "级别",
        cityLabel: "城市",
        workModeLabel: "办公模式",
        baseMonthlySalaryLabel: "月基本工资（万元）",
        baseMonthlySalaryAria: "月基本工资",
        baseMonthlySalaryPlaceholder: "例如 2.3",
        salaryMonthsLabel: "薪资月数（薪）",
        salaryMonthsAria: "薪资月数",
        salaryMonthsPlaceholder: "例如 15.5",
        annualBonusLabel: "年终现金奖金（万元）",
        annualBonusAria: "年终现金奖金",
        annualBonusPlaceholder: "例如 8",
        signOnBonusLabel: "签字费（万元）",
        signOnBonusAria: "签字费",
        signOnBonusPlaceholder: "例如 3",
        relocationBonusLabel: "搬家补贴（万元）",
        relocationBonusAria: "搬家补贴",
        relocationBonusPlaceholder: "例如 1",
        equitySharesLabel: "股票数量（股）",
        equitySharesAria: "股票数量",
        equityPerShareValueLabel: "每股估值（每股）",
        equityPerShareValueAria: "每股估值",
        equityPerShareValuePlaceholder: "例如 18",
        equityVestingYearsLabel: "归属年限（年）",
        equityVestingYearsAria: "归属年限",
        deadlineLabel: "截止日期",
        deadlineAria: "截止日期",
        hrSignalLabel: "招聘方反馈",
        hrSignalAria: "招聘方反馈",
        notesLabel: "备注",
        notesAria: "备注",
        saveSnapshot: "保存谈薪快照",
        markAccepted: "标记为接受",
        markDeclined: "标记为拒绝",
        terminate: "终止谈薪",
        linkedRole: (roleName: string) => `关联岗位：${roleName}`,
        fallbackTitle: "谈薪版本",
        deleteConfirm: (version: number) =>
          `确认删除第 ${version} 轮谈薪吗？此操作不可撤销。`,
        historyTitle: (version: number) => `第 ${version} 轮谈薪`,
        deleteSnapshotAria: (version: number) => `删除第 ${version} 轮谈薪`,
        delete: "删除",
        empty: "还没有保存谈薪快照。",
        tbd: "待补充"
      };
}

function toInputValue(value: number | null) {
  return value === null ? "" : String(value);
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalNumberOrZero(value: string) {
  return parseOptionalNumber(value) ?? 0;
}

function parseCashInputToYuanOrZero(value: string) {
  return parseCashInputToYuan(value) ?? 0;
}

function createNegotiationFormState(company: CompanyRecord): NegotiationFormState {
  const latestSnapshot = getLatestNegotiationSnapshot(company.negotiation);
  const sourceProcess = company.processes.find(
    (process) => process.id === company.negotiation.sourceProcessId
  );

  if (latestSnapshot) {
    return {
      title: latestSnapshot.title,
      level: latestSnapshot.level,
      city: latestSnapshot.city,
      workMode: latestSnapshot.workMode,
      baseMonthlySalary: formatCashInputFromYuan(latestSnapshot.baseMonthlySalary),
      salaryMonths: toInputValue(latestSnapshot.salaryMonths),
      annualBonusCash: formatCashInputFromYuan(latestSnapshot.annualBonusCash),
      signOnBonus: formatCashInputFromYuan(latestSnapshot.signOnBonus),
      relocationBonus: formatCashInputFromYuan(latestSnapshot.relocationBonus),
      equityShares: toInputValue(latestSnapshot.equityShares),
      equityPerShareValue: toInputValue(latestSnapshot.equityPerShareValue),
      equityVestingYears: toInputValue(latestSnapshot.equityVestingYears),
      deadline: latestSnapshot.deadline ?? "",
      hrSignal: latestSnapshot.hrSignal,
      notes: latestSnapshot.notes
    };
  }

  return {
    title: sourceProcess?.roleName ?? "",
    level: "",
    city: "",
    workMode: "",
    baseMonthlySalary: "",
    salaryMonths: "",
    annualBonusCash: "",
    signOnBonus: "",
    relocationBonus: "",
    equityShares: "",
    equityPerShareValue: "",
    equityVestingYears: "",
    deadline: "",
    hrSignal: "",
    notes: ""
  };
}

export function NegotiationSection({
  company,
  suggestionProcessId,
  onStartNegotiation,
  onSaveNegotiationSnapshot,
  onDeleteNegotiationSnapshot,
  onFinishNegotiation
}: NegotiationSectionProps) {
  const locale = resolveAppLocale();
  const copy = getNegotiationCopy(locale);
  const [expanded, setExpanded] = useState(false);
  const latestSnapshot = getLatestNegotiationSnapshot(company.negotiation);
  const snapshots = [...company.negotiation.snapshots].sort((left, right) => right.version - left.version);
  const sourceProcess = company.processes.find(
    (process) => process.id === company.negotiation.sourceProcessId
  );
  const fallbackStartProcess = company.processes.find((process) => process.status === "active");
  const activationProcessId = suggestionProcessId ?? fallbackStartProcess?.id ?? null;
  const [formState, setFormState] = useState(() => createNegotiationFormState(company));

  useEffect(() => {
    setFormState(createNegotiationFormState(company));
  }, [
    company.id,
    company.negotiation.status,
    company.negotiation.sourceProcessId,
    company.negotiation.latestSnapshotId,
    company.negotiation.snapshots.length,
    sourceProcess?.roleName
  ]);

  const canEditNegotiation = company.negotiation.status === "active" && !!onSaveNegotiationSnapshot;
  const canDeleteNegotiationSnapshots =
    company.negotiation.status === "active" && !!onDeleteNegotiationSnapshot;
  const terminalStatus =
    company.negotiation.status === "accepted" ||
    company.negotiation.status === "declined" ||
    company.negotiation.status === "terminated"
      ? company.negotiation.status
      : null;

  function updateField<Key extends keyof NegotiationFormState>(
    key: Key,
    value: NegotiationFormState[Key]
  ) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  function handleSaveSnapshot() {
    if (!onSaveNegotiationSnapshot) {
      return;
    }

    onSaveNegotiationSnapshot(company.id, {
      title: formState.title.trim() || sourceProcess?.roleName || copy.fallbackTitle,
      level: formState.level.trim(),
      city: formState.city.trim(),
      workMode: formState.workMode.trim(),
      baseMonthlySalary: parseCashInputToYuan(formState.baseMonthlySalary),
      salaryMonths: parseOptionalNumber(formState.salaryMonths),
      annualBonusCash: parseCashInputToYuanOrZero(formState.annualBonusCash),
      signOnBonus: parseCashInputToYuanOrZero(formState.signOnBonus),
      relocationBonus: parseCashInputToYuanOrZero(formState.relocationBonus),
      equityShares: parseOptionalNumberOrZero(formState.equityShares),
      equityPerShareValue: parseOptionalNumberOrZero(formState.equityPerShareValue),
      equityVestingYears: parseOptionalNumberOrZero(formState.equityVestingYears),
      deadline: formState.deadline || null,
      hrSignal: formState.hrSignal.trim(),
      notes: formState.notes.trim()
    });
  }

  function handleDeleteSnapshot(snapshot: NegotiationSnapshot) {
    if (!onDeleteNegotiationSnapshot) {
      return;
    }

    if (!window.confirm(copy.deleteConfirm(snapshot.version))) {
      return;
    }

    onDeleteNegotiationSnapshot(company.id, snapshot.id);
  }

  return (
    <section className="company-card__section">
      <div className="company-card__section-header">
        <h4 className="company-card__section-title">{copy.title}</h4>
        <button
          className="button button--ghost"
          type="button"
          aria-label={expanded ? copy.collapseAria : copy.expandAria}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? copy.collapse : copy.expand}
        </button>
      </div>

      {expanded ? (
        <div className="company-card__negotiation">
          {company.negotiation.status === "inactive" && activationProcessId && onStartNegotiation ? (
            <div className="company-card__negotiation-suggestion">
              <p>
                {suggestionProcessId
                  ? copy.suggestedEntry
                  : copy.manualEntry}
              </p>
              <button
                className="button button--primary"
                type="button"
                onClick={() => onStartNegotiation(company.id, activationProcessId)}
              >
                {copy.enterNegotiation}
              </button>
            </div>
          ) : null}

          {latestSnapshot ? (
            <div className="company-card__negotiation-summary">
              <div>
                <span className="company-card__negotiation-eyebrow">{copy.latestSnapshot}</span>
                <strong>{latestSnapshot.title}</strong>
              </div>
              {sourceProcess ? <p>{copy.linkedRole(sourceProcess.roleName)}</p> : null}
              <p>{formatLocalizedCashWithMonths(latestSnapshot.baseMonthlySalary, latestSnapshot.salaryMonths, locale)}</p>
            </div>
          ) : null}

          {terminalStatus ? (
            <div className="company-card__negotiation-summary">
              <div>
                <span className="company-card__negotiation-eyebrow">{copy.currentStatus}</span>
                <strong>{getTerminalNegotiationStatusLabel(locale, terminalStatus)}</strong>
              </div>
              <p>{copy.negotiationEnded}</p>
            </div>
          ) : null}

          {canEditNegotiation ? (
            <div className="company-card__negotiation-form">
              <p className="company-card__negotiation-form-note">
                {copy.formNote}
              </p>
              <div className="company-card__negotiation-form-grid">
                <label className="company-card__negotiation-field">
                  <span>{copy.titleLabel}</span>
                  <input
                    aria-label={copy.titleLabel}
                    className="field field--input"
                    value={formState.title}
                    onChange={(event) => updateField("title", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>{copy.levelLabel}</span>
                  <input
                    aria-label={copy.levelLabel}
                    className="field field--input"
                    value={formState.level}
                    onChange={(event) => updateField("level", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>{copy.cityLabel}</span>
                  <input
                    aria-label={copy.cityLabel}
                    className="field field--input"
                    value={formState.city}
                    onChange={(event) => updateField("city", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>{copy.workModeLabel}</span>
                  <input
                    aria-label={copy.workModeLabel}
                    className="field field--input"
                    value={formState.workMode}
                    onChange={(event) => updateField("workMode", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>{copy.baseMonthlySalaryLabel}</span>
                  <input
                    aria-label={copy.baseMonthlySalaryAria}
                    className="field field--input"
                    inputMode="decimal"
                    placeholder={copy.baseMonthlySalaryPlaceholder}
                    value={formState.baseMonthlySalary}
                    onChange={(event) => updateField("baseMonthlySalary", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>{copy.salaryMonthsLabel}</span>
                  <input
                    aria-label={copy.salaryMonthsAria}
                    className="field field--input"
                    inputMode="decimal"
                    placeholder={copy.salaryMonthsPlaceholder}
                    value={formState.salaryMonths}
                    onChange={(event) => updateField("salaryMonths", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>{copy.annualBonusLabel}</span>
                  <input
                    aria-label={copy.annualBonusAria}
                    className="field field--input"
                    inputMode="decimal"
                    placeholder={copy.annualBonusPlaceholder}
                    value={formState.annualBonusCash}
                    onChange={(event) => updateField("annualBonusCash", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>{copy.signOnBonusLabel}</span>
                  <input
                    aria-label={copy.signOnBonusAria}
                    className="field field--input"
                    inputMode="decimal"
                    placeholder={copy.signOnBonusPlaceholder}
                    value={formState.signOnBonus}
                    onChange={(event) => updateField("signOnBonus", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>{copy.relocationBonusLabel}</span>
                  <input
                    aria-label={copy.relocationBonusAria}
                    className="field field--input"
                    inputMode="decimal"
                    placeholder={copy.relocationBonusPlaceholder}
                    value={formState.relocationBonus}
                    onChange={(event) => updateField("relocationBonus", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>{copy.equitySharesLabel}</span>
                  <input
                    aria-label={copy.equitySharesAria}
                    className="field field--input"
                    inputMode="numeric"
                    value={formState.equityShares}
                    onChange={(event) => updateField("equityShares", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>{copy.equityPerShareValueLabel}</span>
                  <input
                    aria-label={copy.equityPerShareValueAria}
                    className="field field--input"
                    inputMode="decimal"
                    placeholder={copy.equityPerShareValuePlaceholder}
                    value={formState.equityPerShareValue}
                    onChange={(event) => updateField("equityPerShareValue", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>{copy.equityVestingYearsLabel}</span>
                  <input
                    aria-label={copy.equityVestingYearsAria}
                    className="field field--input"
                    inputMode="decimal"
                    value={formState.equityVestingYears}
                    onChange={(event) => updateField("equityVestingYears", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>{copy.deadlineLabel}</span>
                  <input
                    aria-label={copy.deadlineAria}
                    className="field field--input"
                    type="date"
                    value={formState.deadline}
                    onChange={(event) => updateField("deadline", event.target.value)}
                  />
                </label>
              </div>

              <label className="company-card__negotiation-field">
                <span>{copy.hrSignalLabel}</span>
                <input
                  aria-label={copy.hrSignalAria}
                  className="field field--input"
                  value={formState.hrSignal}
                  onChange={(event) => updateField("hrSignal", event.target.value)}
                />
              </label>
              <label className="company-card__negotiation-field">
                <span>{copy.notesLabel}</span>
                <textarea
                  aria-label={copy.notesAria}
                  className="field field--textarea"
                  rows={3}
                  value={formState.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                />
              </label>

              <div className="company-card__negotiation-actions">
                <button className="button button--primary" type="button" onClick={handleSaveSnapshot}>
                  {copy.saveSnapshot}
                </button>
                {onFinishNegotiation ? (
                  <>
                    <button
                      className="button button--secondary"
                      type="button"
                      onClick={() => onFinishNegotiation(company.id, "accepted")}
                    >
                      {copy.markAccepted}
                    </button>
                    <button
                      className="button button--ghost"
                      type="button"
                      onClick={() => onFinishNegotiation(company.id, "declined")}
                    >
                      {copy.markDeclined}
                    </button>
                    <button
                      className="button button--ghost"
                      type="button"
                      onClick={() => onFinishNegotiation(company.id, "terminated")}
                    >
                      {copy.terminate}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          {snapshots.length > 0 ? (
            <div className="company-card__negotiation-history">
              {snapshots.map((snapshot) => (
                <article className="company-card__negotiation-item" key={snapshot.id}>
                  <div className="company-card__negotiation-item-header">
                    <div className="company-card__negotiation-item-copy">
                      <strong>{copy.historyTitle(snapshot.version)}</strong>
                      <span>{snapshot.title}</span>
                    </div>
                    {canDeleteNegotiationSnapshots ? (
                      <button
                        className="button button--ghost button--danger company-card__negotiation-delete"
                        type="button"
                        aria-label={copy.deleteSnapshotAria(snapshot.version)}
                        onClick={() => handleDeleteSnapshot(snapshot)}
                      >
                        {copy.delete}
                      </button>
                    ) : null}
                  </div>
                  <p>{formatLocalizedCashWithMonths(snapshot.baseMonthlySalary, snapshot.salaryMonths, locale)}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="company-card__negotiation-empty">{copy.empty}</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
