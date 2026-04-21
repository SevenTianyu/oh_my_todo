import { useEffect, useState } from "react";
import { getLatestNegotiationSnapshot } from "../lib/compensation";
import type { CompanyRecord, NegotiationSnapshot, NegotiationStatus } from "../types/interview";

interface NegotiationSectionProps {
  company: CompanyRecord;
  suggestionProcessId?: string | null;
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
  equityStrikePrice: string;
  equityReferencePrice: string;
  equityVestingYears: string;
  deadline: string;
  hrSignal: string;
  notes: string;
}

const TERMINAL_NEGOTIATION_LABELS: Record<
  Extract<NegotiationStatus, "accepted" | "declined" | "terminated">,
  string
> = {
  accepted: "已接受",
  declined: "已拒绝",
  terminated: "已终止"
};

function formatCash(value: number | null) {
  if (value === null) return "待补充";

  return value.toLocaleString("zh-CN");
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
      baseMonthlySalary: toInputValue(latestSnapshot.baseMonthlySalary),
      salaryMonths: toInputValue(latestSnapshot.salaryMonths),
      annualBonusCash: toInputValue(latestSnapshot.annualBonusCash),
      signOnBonus: toInputValue(latestSnapshot.signOnBonus),
      relocationBonus: toInputValue(latestSnapshot.relocationBonus),
      equityShares: toInputValue(latestSnapshot.equityShares),
      equityStrikePrice: toInputValue(latestSnapshot.equityStrikePrice),
      equityReferencePrice: toInputValue(latestSnapshot.equityReferencePrice),
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
    equityStrikePrice: "",
    equityReferencePrice: "",
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
  onFinishNegotiation
}: NegotiationSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const latestSnapshot = getLatestNegotiationSnapshot(company.negotiation);
  const snapshots = [...company.negotiation.snapshots].sort((left, right) => right.version - left.version);
  const sourceProcess = company.processes.find(
    (process) => process.id === company.negotiation.sourceProcessId
  );
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
      title: formState.title.trim() || sourceProcess?.roleName || "谈薪版本",
      level: formState.level.trim(),
      city: formState.city.trim(),
      workMode: formState.workMode.trim(),
      baseMonthlySalary: parseOptionalNumber(formState.baseMonthlySalary),
      salaryMonths: parseOptionalNumber(formState.salaryMonths),
      annualBonusCash: parseOptionalNumber(formState.annualBonusCash),
      signOnBonus: parseOptionalNumber(formState.signOnBonus),
      relocationBonus: parseOptionalNumber(formState.relocationBonus),
      equityShares: parseOptionalNumber(formState.equityShares),
      equityStrikePrice: parseOptionalNumber(formState.equityStrikePrice),
      equityReferencePrice: parseOptionalNumber(formState.equityReferencePrice),
      equityVestingYears: parseOptionalNumber(formState.equityVestingYears),
      deadline: formState.deadline || null,
      hrSignal: formState.hrSignal.trim(),
      notes: formState.notes.trim()
    });
  }

  return (
    <section className="company-card__section">
      <div className="company-card__section-header">
        <h4 className="company-card__section-title">谈薪</h4>
        <button
          className="button button--ghost"
          type="button"
          aria-label={`${expanded ? "收起" : "展开"}谈薪`}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "收起" : "展开"}
        </button>
      </div>

      {expanded ? (
        <div className="company-card__negotiation">
          {company.negotiation.status === "inactive" && suggestionProcessId && onStartNegotiation ? (
            <div className="company-card__negotiation-suggestion">
              <p>系统建议：这个流程已经接近 offer 沟通，可以进入谈薪。</p>
              <button
                className="button button--primary"
                type="button"
                onClick={() => onStartNegotiation(company.id, suggestionProcessId)}
              >
                确认进入谈薪
              </button>
            </div>
          ) : null}

          {latestSnapshot ? (
            <div className="company-card__negotiation-summary">
              <div>
                <span className="company-card__negotiation-eyebrow">最新快照</span>
                <strong>{latestSnapshot.title}</strong>
              </div>
              {sourceProcess ? <p>关联岗位：{sourceProcess.roleName}</p> : null}
              <p>
                {formatCash(latestSnapshot.baseMonthlySalary)} ×{" "}
                {latestSnapshot.salaryMonths ?? "待补充"} 薪
              </p>
            </div>
          ) : null}

          {terminalStatus ? (
            <div className="company-card__negotiation-summary">
              <div>
                <span className="company-card__negotiation-eyebrow">当前状态</span>
                <strong>{TERMINAL_NEGOTIATION_LABELS[terminalStatus]}</strong>
              </div>
              <p>谈薪已经结束，历史快照仍然保留在下方。</p>
            </div>
          ) : null}

          {canEditNegotiation ? (
            <div className="company-card__negotiation-form">
              <div className="company-card__negotiation-form-grid">
                <label className="company-card__negotiation-field">
                  <span>谈薪标题</span>
                  <input
                    aria-label="谈薪标题"
                    className="field field--input"
                    value={formState.title}
                    onChange={(event) => updateField("title", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>级别</span>
                  <input
                    aria-label="级别"
                    className="field field--input"
                    value={formState.level}
                    onChange={(event) => updateField("level", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>城市</span>
                  <input
                    aria-label="城市"
                    className="field field--input"
                    value={formState.city}
                    onChange={(event) => updateField("city", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>办公模式</span>
                  <input
                    aria-label="办公模式"
                    className="field field--input"
                    value={formState.workMode}
                    onChange={(event) => updateField("workMode", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>月基本工资</span>
                  <input
                    aria-label="月基本工资"
                    className="field field--input"
                    inputMode="numeric"
                    value={formState.baseMonthlySalary}
                    onChange={(event) => updateField("baseMonthlySalary", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>薪资月数</span>
                  <input
                    aria-label="薪资月数"
                    className="field field--input"
                    inputMode="numeric"
                    value={formState.salaryMonths}
                    onChange={(event) => updateField("salaryMonths", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>年终现金奖金</span>
                  <input
                    aria-label="年终现金奖金"
                    className="field field--input"
                    inputMode="numeric"
                    value={formState.annualBonusCash}
                    onChange={(event) => updateField("annualBonusCash", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>签字费</span>
                  <input
                    aria-label="签字费"
                    className="field field--input"
                    inputMode="numeric"
                    value={formState.signOnBonus}
                    onChange={(event) => updateField("signOnBonus", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>搬家补贴</span>
                  <input
                    aria-label="搬家补贴"
                    className="field field--input"
                    inputMode="numeric"
                    value={formState.relocationBonus}
                    onChange={(event) => updateField("relocationBonus", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>股票数量</span>
                  <input
                    aria-label="股票数量"
                    className="field field--input"
                    inputMode="numeric"
                    value={formState.equityShares}
                    onChange={(event) => updateField("equityShares", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>行权价</span>
                  <input
                    aria-label="行权价"
                    className="field field--input"
                    inputMode="numeric"
                    value={formState.equityStrikePrice}
                    onChange={(event) => updateField("equityStrikePrice", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>参考股价</span>
                  <input
                    aria-label="参考股价"
                    className="field field--input"
                    inputMode="numeric"
                    value={formState.equityReferencePrice}
                    onChange={(event) => updateField("equityReferencePrice", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>归属年限</span>
                  <input
                    aria-label="归属年限"
                    className="field field--input"
                    inputMode="numeric"
                    value={formState.equityVestingYears}
                    onChange={(event) => updateField("equityVestingYears", event.target.value)}
                  />
                </label>
                <label className="company-card__negotiation-field">
                  <span>截止日期</span>
                  <input
                    aria-label="截止日期"
                    className="field field--input"
                    type="date"
                    value={formState.deadline}
                    onChange={(event) => updateField("deadline", event.target.value)}
                  />
                </label>
              </div>

              <label className="company-card__negotiation-field">
                <span>HR 信号</span>
                <input
                  aria-label="HR 信号"
                  className="field field--input"
                  value={formState.hrSignal}
                  onChange={(event) => updateField("hrSignal", event.target.value)}
                />
              </label>
              <label className="company-card__negotiation-field">
                <span>备注</span>
                <textarea
                  aria-label="备注"
                  className="field field--textarea"
                  rows={3}
                  value={formState.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                />
              </label>

              <div className="company-card__negotiation-actions">
                <button className="button button--primary" type="button" onClick={handleSaveSnapshot}>
                  保存谈薪快照
                </button>
                {onFinishNegotiation ? (
                  <>
                    <button
                      className="button button--secondary"
                      type="button"
                      onClick={() => onFinishNegotiation(company.id, "accepted")}
                    >
                      标记为接受
                    </button>
                    <button
                      className="button button--ghost"
                      type="button"
                      onClick={() => onFinishNegotiation(company.id, "declined")}
                    >
                      标记为拒绝
                    </button>
                    <button
                      className="button button--ghost"
                      type="button"
                      onClick={() => onFinishNegotiation(company.id, "terminated")}
                    >
                      终止谈薪
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
                    <strong>{`第 ${snapshot.version} 轮谈薪`}</strong>
                    <span>{snapshot.title}</span>
                  </div>
                  <p>
                    {formatCash(snapshot.baseMonthlySalary)} × {snapshot.salaryMonths ?? "待补充"} 薪
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="company-card__negotiation-empty">还没有保存谈薪快照。</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
