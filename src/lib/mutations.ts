import type { CompanyRecord, InterviewProcess, NewCompanyDraft, RoundRecord } from "../types/interview";

const NUMBERED_ROUND_LABELS = [
  "一面",
  "二面",
  "三面",
  "四面",
  "五面",
  "六面",
  "七面",
  "八面",
  "九面",
  "十面"
] as const;

const CHINESE_ROUND_ORDER: Record<string, number> = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10
};

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createId(prefix: string, value: string) {
  const base = toSlug(value) || prefix;
  return `${prefix}-${base}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getRoundOrder(name: string) {
  const match = name.trim().match(/^([一二三四五六七八九十]+)面$/);
  if (!match) return null;

  return CHINESE_ROUND_ORDER[match[1]] ?? null;
}

function getNextRoundName(rounds: RoundRecord[]) {
  const maxOrder = rounds.reduce((currentMax, round) => {
    const order = getRoundOrder(round.name);
    return order && order > currentMax ? order : currentMax;
  }, 0);

  if (maxOrder === 0) {
    return NUMBERED_ROUND_LABELS[0];
  }

  return NUMBERED_ROUND_LABELS[maxOrder] ?? `第${maxOrder + 1}轮面试`;
}

export function updateCompanySummary(
  companies: CompanyRecord[],
  companyId: string,
  patch: Partial<Pick<CompanyRecord, "name" | "companyType" | "overallImpression">>
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
                  name: getNextRoundName(process.rounds),
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

export function createCompanyWithProcess(
  companies: CompanyRecord[],
  draft: NewCompanyDraft
): CompanyRecord[] {
  const companyId = createId("company", draft.companyName);
  const processId = createId("process", draft.roleName);

  return [
    {
      id: companyId,
      name: draft.companyName,
      companyType: draft.companyType,
      overallImpression: "",
      processes: [
        {
          id: processId,
          roleName: draft.roleName,
          stage: draft.stage,
          nextStep: draft.nextStep,
          status: "active",
          rounds: [
            {
              id: createId("round", draft.nextStep),
              name: draft.nextStep,
              scheduledAt: null,
              status: "pending",
              notes: ""
            }
          ]
        }
      ]
    },
    ...companies
  ];
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

export function updateProcessRecord(
  companies: CompanyRecord[],
  companyId: string,
  processId: string,
  patch: Partial<Pick<InterviewProcess, "roleName">>
): CompanyRecord[] {
  return companies.map((company) => {
    if (company.id !== companyId) return company;

    return {
      ...company,
      processes: company.processes.map((process) =>
        process.id === processId ? { ...process, ...patch } : process
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
