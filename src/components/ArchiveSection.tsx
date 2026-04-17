import type { CompanyRecord } from "../types/interview";

export function ArchiveSection({ companies }: { companies: CompanyRecord[] }) {
  return (
    <details className="panel archive-panel">
      <summary className="archive-panel__summary">
        <div>
          <p className="archive-panel__eyebrow">Archive</p>
          <span className="archive-panel__title">归档流程（{companies.length}）</span>
        </div>
        <span className="archive-panel__hint">保留历史判断</span>
      </summary>
      <div className="archive-panel__list">
        {companies.map((company) => (
          <article className="company-card company-card--archived" key={company.id}>
            <strong className="company-card__name">{company.name}</strong>
            <div>{company.overallImpression}</div>
          </article>
        ))}
      </div>
    </details>
  );
}
