import type {
  CompanyRecord,
  CompensationNegotiation,
  InterviewProcess,
  NegotiationSnapshot,
  NegotiationStatus,
  NewCompanyDraft,
  RoundRecord
} from "../types/interview";

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

const DEFAULT_FIRST_ROUND_NAME = "初筛沟通";

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

function createEmptyNegotiation(): CompensationNegotiation {
  return {
    status: "inactive",
    sourceProcessId: null,
    startedAt: null,
    endedAt: null,
    latestSnapshotId: null,
    snapshots: []
  };
}

function getNegotiation(company: CompanyRecord) {
  return company.negotiation ?? createEmptyNegotiation();
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
  const firstRoundName = DEFAULT_FIRST_ROUND_NAME;

  return [
    {
      id: companyId,
      name: draft.companyName,
      companyType: draft.companyType,
      overallImpression: "",
      negotiation: createEmptyNegotiation(),
      processes: [
        {
          id: processId,
          roleName: draft.roleName,
          nextStep: firstRoundName,
          status: "active",
          rounds: [
            {
              id: createId("round", firstRoundName),
              name: firstRoundName,
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
        process.id === processId ? { ...process, status: "archived" } : process
      )
    };
  });
}

export function startNegotiation(
  companies: CompanyRecord[],
  companyId: string,
  processId: string,
  now: string = new Date().toISOString()
): CompanyRecord[] {
  return companies.map((company) => {
    if (company.id !== companyId) return company;

    const negotiation = getNegotiation(company);
    const shouldResetHistory =
      negotiation.sourceProcessId !== null && negotiation.sourceProcessId !== processId;
    const nextNegotiation = shouldResetHistory ? createEmptyNegotiation() : negotiation;

    return {
      ...company,
      negotiation: {
        ...nextNegotiation,
        status: "active",
        sourceProcessId: processId,
        startedAt: shouldResetHistory ? now : negotiation.startedAt ?? now,
        endedAt: null
      }
    };
  });
}

export function saveNegotiationSnapshot(
  companies: CompanyRecord[],
  companyId: string,
  draft: Omit<NegotiationSnapshot, "id" | "version" | "createdAt">
): CompanyRecord[] {
  return companies.map((company) => {
    if (company.id !== companyId) return company;

    const negotiation = getNegotiation(company);
    const version = negotiation.snapshots.length + 1;
    const snapshot: NegotiationSnapshot = {
      ...draft,
      id: createId("negotiation", `${company.id}-${version}`),
      version,
      createdAt: new Date().toISOString()
    };

    return {
      ...company,
      negotiation: {
        ...negotiation,
        status: "active",
        latestSnapshotId: snapshot.id,
        snapshots: [...negotiation.snapshots, snapshot]
      }
    };
  });
}

export function deleteNegotiationSnapshot(
  companies: CompanyRecord[],
  companyId: string,
  snapshotId: string
): CompanyRecord[] {
  return companies.map((company) => {
    if (company.id !== companyId) return company;

    const negotiation = getNegotiation(company);
    const nextSnapshots = negotiation.snapshots
      .filter((snapshot) => snapshot.id !== snapshotId)
      .map((snapshot, index) => ({
        ...snapshot,
        version: index + 1
      }));

    return {
      ...company,
      negotiation: {
        ...negotiation,
        latestSnapshotId: nextSnapshots.at(-1)?.id ?? null,
        snapshots: nextSnapshots
      }
    };
  });
}

export function finishNegotiation(
  companies: CompanyRecord[],
  companyId: string,
  status: Extract<NegotiationStatus, "accepted" | "declined" | "terminated">,
  now: string = new Date().toISOString()
): CompanyRecord[] {
  return companies.map((company) => {
    if (company.id !== companyId) return company;

    const negotiation = getNegotiation(company);

    return {
      ...company,
      negotiation: {
        ...negotiation,
        status,
        endedAt: now
      }
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
