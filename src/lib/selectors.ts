import type {
  CompanyGroup,
  CompanyRecord,
  GroupingMode,
  NegotiationSnapshot,
  RoundStatus,
  UpcomingInterview
} from "../types/interview";
import { getLatestNegotiationSnapshot, getNegotiationMetrics, type NegotiationMetrics } from "./compensation";

const GROUP_LABELS: Record<GroupingMode, Record<string, string>> = {
  companyType: {
    startup: "创业公司",
    "big-tech": "大厂"
  },
  stage: {
    screening: "筛选中",
    interviewing: "面试中",
    negotiating: "谈薪中"
  }
};

const GROUP_ORDER: Record<GroupingMode, string[]> = {
  companyType: ["startup", "big-tech"],
  stage: ["screening", "interviewing", "negotiating"]
};

const INTERVIEWING_ROUND_STATUSES = new Set<RoundStatus>([
  "scheduled",
  "completed",
  "waiting-result",
  "closed"
]);
const NEGOTIATION_PROGRESS_STATUSES = new Set<RoundStatus>(["completed", "waiting-result", "closed"]);
const NEGOTIATION_SIGNAL_PATTERNS = [
  /offer/i,
  /package/i,
  /compensation/i,
  /谈薪/,
  /薪资/,
  /薪酬/,
  /总包/
];

type DerivedStage = "screening" | "interviewing" | "negotiating";

export interface OfferComparisonRow {
  companyId: string;
  companyName: string;
  sourceProcessId: string;
  sourceRoleName: string;
  latestVersion: number;
  latestSnapshot: NegotiationSnapshot;
  metrics: NegotiationMetrics;
}

function endOfWindow(now: Date) {
  const end = new Date(now);
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getProcessStage(process: CompanyRecord["processes"][number]): DerivedStage {
  return process.rounds.some(
    (round) => round.scheduledAt !== null || INTERVIEWING_ROUND_STATUSES.has(round.status)
  )
    ? "interviewing"
    : "screening";
}

function getPrimaryStage(company: CompanyRecord): DerivedStage {
  if (company.negotiation.status === "active") {
    return "negotiating";
  }

  return company.processes
    .filter((process) => process.status === "active")
    .some((process) => getProcessStage(process) === "interviewing")
    ? "interviewing"
    : "screening";
}

function hasMeaningfulNegotiationProgress(process: CompanyRecord["processes"][number]) {
  return process.rounds.some((round) => NEGOTIATION_PROGRESS_STATUSES.has(round.status));
}

function hasNegotiationSignal(process: CompanyRecord["processes"][number]) {
  const searchText = [process.nextStep, ...process.rounds.flatMap((round) => [round.name, round.notes])]
    .join("\n")
    .trim();

  return NEGOTIATION_SIGNAL_PATTERNS.some((pattern) => pattern.test(searchText));
}

export function getActiveCompanies(companies: CompanyRecord[]) {
  return companies.filter((company) =>
    company.negotiation.status === "active" ||
    company.processes.some((process) => process.status === "active")
  );
}

export function getArchivedCompanies(companies: CompanyRecord[]) {
  return companies.filter(
    (company) =>
      company.negotiation.status !== "active" &&
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
    .sort((left, right) => {
      const leftTime = new Date(left.scheduledAt).getTime();
      const rightTime = new Date(right.scheduledAt).getTime();

      return leftTime - rightTime || left.scheduledAt.localeCompare(right.scheduledAt);
    });
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

export function getOfferComparisonCompanies(companies: CompanyRecord[], scope: "active" | "all") {
  return companies.filter((company) =>
    scope === "active"
      ? company.negotiation.status === "active"
      : company.negotiation.snapshots.length > 0
  );
}

export function getOfferComparisonRows(
  companies: CompanyRecord[],
  scope: "active" | "all"
): OfferComparisonRow[] {
  return getOfferComparisonCompanies(companies, scope).flatMap((company) => {
    const latestSnapshot = getLatestNegotiationSnapshot(company.negotiation);
    const sourceProcess = company.processes.find(
      (process) => process.id === company.negotiation.sourceProcessId
    );

    if (!latestSnapshot || !company.negotiation.sourceProcessId || !sourceProcess) {
      return [];
    }

    return [
      {
        companyId: company.id,
        companyName: company.name,
        sourceProcessId: company.negotiation.sourceProcessId,
        sourceRoleName: sourceProcess.roleName,
        latestVersion: latestSnapshot.version,
        latestSnapshot,
        metrics: getNegotiationMetrics(latestSnapshot)
      }
    ];
  });
}

export function getNegotiationSuggestionProcessIds(companies: CompanyRecord[]) {
  return Object.fromEntries(
    companies.flatMap((company) => {
      if (company.negotiation.status !== "inactive") {
        return [];
      }

      const activeProcess = company.processes.find(
        (process) =>
          process.status === "active" &&
          hasMeaningfulNegotiationProgress(process) &&
          hasNegotiationSignal(process)
      );

      return activeProcess ? [[company.id, activeProcess.id]] : [];
    })
  );
}
