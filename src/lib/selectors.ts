import type {
  CompanyGroup,
  CompanyRecord,
  GroupingMode,
  Stage,
  UpcomingInterview
} from "../types/interview";

const GROUP_LABELS: Record<GroupingMode, Record<string, string>> = {
  companyType: {
    startup: "创业公司",
    "big-tech": "大厂"
  },
  stage: {
    screening: "筛选中",
    interviewing: "面试中",
    offer: "Offer 阶段",
    closed: "已结束"
  },
  priority: {
    high: "高优先级",
    medium: "中优先级",
    low: "低优先级"
  }
};

const GROUP_ORDER: Record<GroupingMode, string[]> = {
  companyType: ["startup", "big-tech"],
  stage: ["screening", "interviewing", "offer", "closed"],
  priority: ["high", "medium", "low"]
};

function endOfWindow(now: Date) {
  const end = new Date(now);
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getPrimaryStage(company: CompanyRecord): Stage {
  return company.processes.find((process) => process.status === "active")?.stage ?? "closed";
}

export function getActiveCompanies(companies: CompanyRecord[]) {
  return companies.filter((company) =>
    company.processes.some((process) => process.status === "active")
  );
}

export function getArchivedCompanies(companies: CompanyRecord[]) {
  return companies.filter(
    (company) =>
      company.processes.length > 0 &&
      company.processes.every((process) => process.status === "archived")
  );
}

export function getUpcomingInterviews(companies: CompanyRecord[], now: Date): UpcomingInterview[] {
  const end = endOfWindow(now);

  return companies
    .flatMap((company) =>
      company.processes.flatMap((process) =>
        process.rounds.flatMap((round) => {
          if (round.status !== "scheduled" || !round.scheduledAt) {
            return [];
          }

          const scheduledAt = new Date(round.scheduledAt);
          if (scheduledAt < now || scheduledAt > end) {
            return [];
          }

          return [
            {
              companyId: company.id,
              companyName: company.name,
              processId: process.id,
              roleName: process.roleName,
              roundId: round.id,
              roundName: round.name,
              scheduledAt: round.scheduledAt
            }
          ];
        })
      )
    )
    .sort((left, right) => left.scheduledAt.localeCompare(right.scheduledAt));
}

export function getGroupedCompanies(
  companies: CompanyRecord[],
  grouping: GroupingMode
): CompanyGroup[] {
  const activeCompanies = getActiveCompanies(companies);
  const buckets = new Map<string, CompanyRecord[]>();

  for (const company of activeCompanies) {
    const key =
      grouping === "companyType"
        ? company.companyType
        : grouping === "priority"
          ? company.priority
          : getPrimaryStage(company);

    const bucket = buckets.get(key) ?? [];
    bucket.push(company);
    buckets.set(key, bucket);
  }

  return GROUP_ORDER[grouping]
    .filter((key) => buckets.has(key))
    .map((key) => ({
      key,
      label: GROUP_LABELS[grouping][key],
      companies: buckets.get(key) ?? []
    }));
}
