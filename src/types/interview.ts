export type GroupingMode = "companyType" | "stage";
export type CompanyType = "startup" | "big-tech";
export type RoundStatus = "pending" | "scheduled" | "completed" | "waiting-result" | "closed";
export type ProcessStatus = "active" | "archived";
export type NegotiationStatus = "inactive" | "active" | "accepted" | "declined" | "terminated";

export interface RoundRecord {
  id: string;
  name: string;
  scheduledAt: string | null;
  status: RoundStatus;
  notes: string;
}

export interface InterviewProcess {
  id: string;
  roleName: string;
  nextStep: string;
  status: ProcessStatus;
  archiveNote?: string | null;
  archivedAt?: string | null;
  rounds: RoundRecord[];
}

export interface NegotiationSnapshot {
  id: string;
  version: number;
  createdAt: string;
  title: string;
  level: string;
  city: string;
  workMode: string;
  baseMonthlySalary: number | null;
  salaryMonths: number | null;
  annualBonusCash: number | null;
  signOnBonus: number | null;
  relocationBonus: number | null;
  equityShares: number | null;
  equityPerShareValue: number | null;
  equityVestingYears: number | null;
  deadline: string | null;
  hrSignal: string;
  notes: string;
}

export interface CompensationNegotiation {
  status: NegotiationStatus;
  sourceProcessId: string | null;
  startedAt: string | null;
  endedAt: string | null;
  latestSnapshotId: string | null;
  snapshots: NegotiationSnapshot[];
}

export interface CompanyRecord {
  id: string;
  name: string;
  companyType: CompanyType;
  overallImpression: string;
  processes: InterviewProcess[];
  negotiation: CompensationNegotiation;
}

export interface UpcomingInterview {
  companyId: string;
  companyName: string;
  processId: string;
  roleName: string;
  roundId: string;
  roundName: string;
  scheduledAt: string;
}

export interface CompanyGroup {
  key: string;
  label: string;
  companies: CompanyRecord[];
}

export interface NewCompanyDraft {
  companyName: string;
  companyType: CompanyType;
  roleName: string;
}
