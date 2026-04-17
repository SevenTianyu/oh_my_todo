import type { CompanyRecord } from "../types/interview";

export function ArchiveSection({ companies }: { companies: CompanyRecord[] }) {
  return (
    <details className="panel">
      <summary>归档流程（{companies.length}）</summary>
      {companies.map((company) => (
        <article className="company-card" key={company.id}>
          <strong>{company.name}</strong>
          <div>{company.overallImpression}</div>
        </article>
      ))}
    </details>
  );
}
