import { getLatestNegotiationSnapshot } from "../lib/compensation";
import { formatCashDisplayInWan } from "../lib/negotiationUnits";
import type { CompanyRecord, NegotiationStatus } from "../types/interview";

const TERMINAL_NEGOTIATION_LABELS: Record<
  Extract<NegotiationStatus, "accepted" | "declined" | "terminated">,
  string
> = {
  accepted: "已接受",
  declined: "已拒绝",
  terminated: "已终止"
};

export function ArchiveSection({ companies }: { companies: CompanyRecord[] }) {
  return (
    <details className="panel archive-panel">
      <summary className="archive-panel__summary">
        <div>
          <p className="archive-panel__eyebrow">Archive</p>
          <span className="archive-panel__title">历史判断档案（{companies.length}）</span>
        </div>
        <span className="archive-panel__hint">保留已经走完的上下文</span>
      </summary>
      <div className="archive-panel__list">
        {companies.map((company) => {
          const latestSnapshot = getLatestNegotiationSnapshot(company.negotiation);
          const sourceProcess = company.processes.find(
            (process) => process.id === company.negotiation.sourceProcessId
          );
          const snapshots = [...company.negotiation.snapshots].sort(
            (left, right) => right.version - left.version
          );
          const terminalStatus =
            company.negotiation.status === "accepted" ||
            company.negotiation.status === "declined" ||
            company.negotiation.status === "terminated"
              ? company.negotiation.status
              : null;

          return (
            <article className="company-card company-card--archived" key={company.id}>
              <strong className="company-card__name">{company.name}</strong>
              <div>{company.overallImpression}</div>

              {latestSnapshot ? (
                <div className="company-card__negotiation">
                  <div className="company-card__negotiation-summary">
                    <div>
                      <span className="company-card__negotiation-eyebrow">谈薪结果</span>
                      <strong>
                        {terminalStatus ? TERMINAL_NEGOTIATION_LABELS[terminalStatus] : "已保存谈薪记录"}
                      </strong>
                    </div>
                    <p>{latestSnapshot.title}</p>
                    {sourceProcess ? <p>关联岗位：{sourceProcess.roleName}</p> : null}
                    <p>
                      {formatCashDisplayInWan(latestSnapshot.baseMonthlySalary)} ×{" "}
                      {latestSnapshot.salaryMonths ?? "待补充"} 薪
                    </p>
                    {latestSnapshot.notes ? <p>{latestSnapshot.notes}</p> : null}
                  </div>

                  <div className="company-card__negotiation-history">
                    <p className="company-card__negotiation-eyebrow">
                      谈薪历史（{snapshots.length}）
                    </p>
                    {snapshots.map((snapshot) => (
                      <article className="company-card__negotiation-item" key={snapshot.id}>
                        <div className="company-card__negotiation-item-header">
                          <strong>版本 {snapshot.version}</strong>
                          <span>{snapshot.title}</span>
                        </div>
                        <p>
                          {formatCashDisplayInWan(snapshot.baseMonthlySalary)} ×{" "}
                          {snapshot.salaryMonths ?? "待补充"} 薪
                        </p>
                        {snapshot.hrSignal ? <p>HR 信号：{snapshot.hrSignal}</p> : null}
                        {snapshot.notes ? <p>{snapshot.notes}</p> : null}
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </details>
  );
}
