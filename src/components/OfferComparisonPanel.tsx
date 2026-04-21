import type { OfferComparisonRow } from "../lib/selectors";
import { formatCashDisplayInWan } from "../lib/negotiationUnits";

interface OfferComparisonPanelProps {
  rows: OfferComparisonRow[];
  scope: "active" | "all";
  onScopeChange: (scope: "active" | "all") => void;
}

function formatCurrency(value: number | null) {
  return formatCashDisplayInWan(value);
}

function formatSalaryRange(row: OfferComparisonRow) {
  const { baseMonthlySalary, salaryMonths } = row.latestSnapshot;

  if (baseMonthlySalary === null || salaryMonths === null) {
    return "待补充";
  }

  return `${formatCurrency(baseMonthlySalary)} × ${salaryMonths} 薪`;
}

export function OfferComparisonPanel({
  rows,
  scope,
  onScopeChange
}: OfferComparisonPanelProps) {
  function getFilterButtonClassName(nextScope: "active" | "all") {
    const isActive = scope === nextScope;

    return [
      "button",
      isActive ? "button--primary page__hero-action page__hero-action--primary" : "button--secondary page__hero-action page__hero-action--support",
      "offer-panel__filter-button"
    ].join(" ");
  }

  return (
    <section className="panel offer-panel">
      <div className="section-heading">
        <div>
          <p className="section-heading__eyebrow">Offer Comparison</p>
          <h2>Offer 对比</h2>
        </div>
        <div className="offer-panel__filters" aria-label="谈薪范围切换">
          <button
            className={getFilterButtonClassName("active")}
            type="button"
            aria-pressed={scope === "active"}
            onClick={() => onScopeChange("active")}
          >
            当前谈薪公司
          </button>
          <button
            className={getFilterButtonClassName("all")}
            type="button"
            aria-pressed={scope === "all"}
            onClick={() => onScopeChange("all")}
          >
            全部有薪资记录的公司
          </button>
        </div>
      </div>
      <table className="offer-panel__table">
        <thead>
          <tr>
            <th>公司</th>
            <th>来源岗位</th>
            <th>月薪 × 月数</th>
            <th>首年总包</th>
            <th>长期年化总包</th>
            <th>截止时间</th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <tr key={`${row.companyId}-${row.latestVersion}`}>
                <td>{row.companyName}</td>
                <td>{row.sourceRoleName}</td>
                <td>{formatSalaryRange(row)}</td>
                <td>{formatCurrency(row.metrics.firstYearTotal)}</td>
                <td>{formatCurrency(row.metrics.longTermAnnualizedTotal)}</td>
                <td>{row.latestSnapshot.deadline ?? "待补充"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6}>当前范围内还没有可对比的 offer 快照。</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
