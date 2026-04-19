export type GroupingMode = "companyType" | "stage";
export type CompanyType = "startup" | "big-tech";
export type Stage = "screening" | "interviewing" | "offer" | "closed";
export type RoundStatus = "pending" | "scheduled" | "completed" | "waiting-result" | "closed";
export type ProcessStatus = "active" | "archived";
export type ActiveStage = Exclude<Stage, "closed">;

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
  stage: Stage;
  nextStep: string;
  status: ProcessStatus;
  rounds: RoundRecord[];
}

export interface CompanyRecord {
  id: string;
  name: string;
  companyType: CompanyType;
  overallImpression: string;
  processes: InterviewProcess[];
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
  stage: ActiveStage;
  nextStep: string;
}
