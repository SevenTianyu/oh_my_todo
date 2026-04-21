import { useState } from "react";
import { getLatestNegotiationSnapshot } from "../lib/compensation";
import type { CompanyRecord, NegotiationSnapshot, NegotiationStatus } from "../types/interview";

type NegotiationSnapshotDraft = Omit<NegotiationSnapshot, "id" | "version" | "createdAt">;

interface NegotiationSectionProps {
  company: CompanyRecord;
  suggestionProcessId?: string | null;
  onStartNegotiation?: (companyId: string, processId: string) => void;
  onSaveNegotiationSnapshot?: (companyId: string, draft: NegotiationSnapshotDraft) => void;
  onFinishNegotiation?: (
    companyId: string,
    status: Extract<NegotiationStatus, "accepted" | "declined" | "terminated">
  ) => void;
}

function formatCash(value: number | null) {
  if (value === null) return "待补充";

  return value.toLocaleString("zh-CN");
}

export function NegotiationSection({
  company,
  suggestionProcessId,
  onStartNegotiation,
  onSaveNegotiationSnapshot: _onSaveNegotiationSnapshot,
  onFinishNegotiation: _onFinishNegotiation
}: NegotiationSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const latestSnapshot = getLatestNegotiationSnapshot(company.negotiation);
  const snapshots = [...company.negotiation.snapshots].sort((left, right) => right.version - left.version);

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
          {company.negotiation.status === "inactive" && suggestionProcessId ? (
            <div className="company-card__negotiation-suggestion">
              <p>系统建议：这个流程已经接近 offer 沟通，可以进入谈薪。</p>
              <button
                className="button button--primary"
                type="button"
                onClick={() => onStartNegotiation?.(company.id, suggestionProcessId)}
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
              <p>
                {formatCash(latestSnapshot.baseMonthlySalary)} ×{" "}
                {latestSnapshot.salaryMonths ?? "待补充"} 薪
              </p>
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
