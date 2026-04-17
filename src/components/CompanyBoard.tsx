import type { CompanyGroup } from "../types/interview";

export function CompanyBoard({ groups }: { groups: CompanyGroup[] }) {
  return (
    <section className="board-grid">
      {groups.map((group) => (
        <div className="panel" key={group.key}>
          <h3>{group.label}</h3>
          {group.companies.map((company) => (
            <article className="company-card" key={company.id}>
              <strong>{company.name}</strong>
              <div>{company.processes.find((process) => process.status === "active")?.nextStep}</div>
              <div>{company.highlights}</div>
            </article>
          ))}
        </div>
      ))}
    </section>
  );
}
