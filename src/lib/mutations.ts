import type { CompanyRecord, RoundRecord } from "../types/interview";

export function updateCompanySummary(
  companies: CompanyRecord[],
  companyId: string,
  patch: Partial<Pick<CompanyRecord, "overallImpression" | "highlights" | "risks" | "priority">>
): CompanyRecord[] {
  return companies.map((company) =>
    company.id === companyId ? { ...company, ...patch } : company
  );
}

export function addRoundToProcess(
  companies: CompanyRecord[],
  companyId: string,
  processId: string
): CompanyRecord[] {
  return companies.map((company) => {
    if (company.id !== companyId) return company;

    return {
      ...company,
      processes: company.processes.map((process) =>
        process.id === processId
          ? {
              ...process,
              rounds: [
                ...process.rounds,
                {
                  id: `${processId}-round-${process.rounds.length + 1}`,
                  name: `新增轮次 ${process.rounds.length + 1}`,
                  scheduledAt: null,
                  status: "pending",
                  notes: ""
                }
              ]
            }
          : process
      )
    };
  });
}

export function archiveProcessById(
  companies: CompanyRecord[],
  companyId: string,
  processId: string
): CompanyRecord[] {
  return companies.map((company) => {
    if (company.id !== companyId) return company;

    return {
      ...company,
      processes: company.processes.map((process) =>
        process.id === processId ? { ...process, status: "archived", stage: "closed" } : process
      )
    };
  });
}

export function updateRoundRecord(
  companies: CompanyRecord[],
  companyId: string,
  processId: string,
  roundId: string,
  patch: Partial<RoundRecord>
): CompanyRecord[] {
  return companies.map((company) => {
    if (company.id !== companyId) return company;

    return {
      ...company,
      processes: company.processes.map((process) =>
        process.id === processId
          ? {
              ...process,
              rounds: process.rounds.map((round) =>
                round.id === roundId ? { ...round, ...patch } : round
              )
            }
          : process
      )
    };
  });
}
