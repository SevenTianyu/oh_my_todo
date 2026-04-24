import type { OfferComparisonRow } from "../lib/selectors";
import { formatLocalizedCashDisplay, formatLocalizedCashWithMonths, resolveAppLocale } from "../lib/locale";

interface OfferComparisonPanelProps {
  rows: OfferComparisonRow[];
  scope: "active" | "all";
  onScopeChange: (scope: "active" | "all") => void;
}

function formatSalaryRange(row: OfferComparisonRow, locale: "zh-CN" | "en") {
  const { baseMonthlySalary, salaryMonths } = row.latestSnapshot;
  return formatLocalizedCashWithMonths(baseMonthlySalary, salaryMonths, locale);
}

export function OfferComparisonPanel({
  rows,
  scope,
  onScopeChange
}: OfferComparisonPanelProps) {
  const locale = resolveAppLocale();
  const copy =
    locale === "en"
      ? {
          eyebrow: "Salary Comparison",
          filtersAria: "Negotiation scope switcher",
          activeScope: "Active Negotiations",
          allScope: "All Saved Packages",
          company: "Company",
          role: "Source Role",
          monthly: "Monthly × Months",
          firstYear: "First-year Total",
          longTerm: "Long-term Annualized",
          deadline: "Deadline",
          empty: "No comparable offer snapshot in this scope yet.",
          tbd: "TBD"
        }
      : {
          eyebrow: "薪资对比",
          filtersAria: "谈薪范围切换",
          activeScope: "当前谈薪公司",
          allScope: "全部有薪资记录的公司",
          company: "公司",
          role: "来源岗位",
          monthly: "月薪 × 月数",
          firstYear: "首年总包",
          longTerm: "长期年化总包",
          deadline: "截止时间",
          empty: "当前范围内还没有可对比的报价快照。",
          tbd: "待补充"
        };

  function getFilterButtonClassName(nextScope: "active" | "all") {
    const isActive = scope === nextScope;

    return [
      "button",
      isActive ? "button--primary" : "button--ghost",
      "offer-panel__filter-button"
    ].join(" ");
  }

  return (
    <section className="panel offer-panel">
      <div className="section-heading">
        <div>
          <p className="section-heading__eyebrow">{copy.eyebrow}</p>
        </div>
        <div className="offer-panel__filters" aria-label={copy.filtersAria}>
          <button
            className={getFilterButtonClassName("active")}
            type="button"
            aria-pressed={scope === "active"}
            onClick={() => onScopeChange("active")}
          >
            {copy.activeScope}
          </button>
          <button
            className={getFilterButtonClassName("all")}
            type="button"
            aria-pressed={scope === "all"}
            onClick={() => onScopeChange("all")}
          >
            {copy.allScope}
          </button>
        </div>
      </div>
      <table className="offer-panel__table">
        <colgroup>
          <col className="offer-panel__col offer-panel__col--company" />
          <col className="offer-panel__col offer-panel__col--role" />
          <col className="offer-panel__col offer-panel__col--salary" />
          <col className="offer-panel__col offer-panel__col--first-year" />
          <col className="offer-panel__col offer-panel__col--long-term" />
          <col className="offer-panel__col offer-panel__col--deadline" />
        </colgroup>
        <thead>
          <tr>
            <th>{copy.company}</th>
            <th>{copy.role}</th>
            <th>{copy.monthly}</th>
            <th>{copy.firstYear}</th>
            <th>{copy.longTerm}</th>
            <th>{copy.deadline}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <tr key={`${row.companyId}-${row.latestVersion}`}>
                <td>{row.companyName}</td>
                <td>{row.sourceRoleName}</td>
                <td>{formatSalaryRange(row, locale)}</td>
                <td>{formatLocalizedCashDisplay(row.metrics.firstYearTotal, locale)}</td>
                <td>{formatLocalizedCashDisplay(row.metrics.longTermAnnualizedTotal, locale)}</td>
                <td>{row.latestSnapshot.deadline ?? copy.tbd}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6}>{copy.empty}</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
