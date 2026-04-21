import type {
  CompanyRecord,
  CompensationNegotiation,
  CompanyType,
  GroupingMode,
  InterviewProcess,
  NegotiationSnapshot,
  NegotiationStatus,
  ProcessStatus,
  RoundRecord,
  RoundStatus
} from "../types/interview";

const STORAGE_KEY = "interview-workbench:v1";
const GROUPING_MODES = new Set<GroupingMode>(["companyType", "stage"]);
const COMPANY_TYPES = new Set<CompanyType>(["startup", "big-tech"]);
const PROCESS_STATUSES = new Set<ProcessStatus>(["active", "archived"]);
const ROUND_STATUSES = new Set<RoundStatus>([
  "pending",
  "scheduled",
  "completed",
  "waiting-result",
  "closed"
]);
const NEGOTIATION_STATUSES = new Set<NegotiationStatus>([
  "inactive",
  "active",
  "accepted",
  "declined",
  "terminated"
]);

type ImportErrorCode =
  | "invalid_json"
  | "invalid_shape"
  | "invalid_enum"
  | "missing_required_field";

type RawRecord = Record<string, unknown>;

export interface WorkbenchSnapshotV2 {
  version: 2;
  grouping: GroupingMode;
  companies: CompanyRecord[];
}

export type WorkbenchSnapshot = WorkbenchSnapshotV2;

export interface WorkbenchImportError {
  code: ImportErrorCode;
  message: string;
  path?: string;
}

export type WorkbenchImportResult =
  | { ok: true; snapshot: WorkbenchSnapshot }
  | { ok: false; error: WorkbenchImportError };

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPath(path: string, key: string) {
  return path ? `${path}.${key}` : key;
}

function getRequiredField(record: RawRecord, key: string, path: string): unknown {
  if (!(key in record)) {
    throw {
      code: "missing_required_field",
      message: `Missing required field: ${getPath(path, key)}`,
      path: getPath(path, key)
    } satisfies WorkbenchImportError;
  }

  return record[key];
}

function readString(record: RawRecord, key: string, path: string): string {
  const value = getRequiredField(record, key, path);

  if (typeof value !== "string") {
    throw {
      code: "invalid_shape",
      message: `Expected ${getPath(path, key)} to be a string`,
      path: getPath(path, key)
    } satisfies WorkbenchImportError;
  }

  return value;
}

function readNullableString(record: RawRecord, key: string, path: string): string | null {
  const value = getRequiredField(record, key, path);

  if (typeof value === "string" || value === null) {
    return value;
  }

  throw {
    code: "invalid_shape",
    message: `Expected ${getPath(path, key)} to be a string or null`,
    path: getPath(path, key)
  } satisfies WorkbenchImportError;
}

function readOptionalString(record: RawRecord, key: string): string | null {
  const value = record[key];

  if (typeof value === "undefined") {
    return null;
  }

  return typeof value === "string" ? value : null;
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

function normalizeNegotiation(negotiation: unknown): CompensationNegotiation {
  if (!isRecord(negotiation)) {
    return createEmptyNegotiation();
  }

  return readNegotiation(negotiation, "negotiation");
}

function normalizeCompanyForExport(company: CompanyRecord): CompanyRecord {
  return {
    ...company,
    negotiation: normalizeNegotiation(company.negotiation)
  };
}

function normalizeSnapshotForExport(snapshot: WorkbenchSnapshot): WorkbenchSnapshot {
  return {
    ...snapshot,
    companies: snapshot.companies.map(normalizeCompanyForExport)
  };
}

function readArray(record: RawRecord, key: string, path: string): unknown[] {
  const value = getRequiredField(record, key, path);

  if (!Array.isArray(value)) {
    throw {
      code: "invalid_shape",
      message: `Expected ${getPath(path, key)} to be an array`,
      path: getPath(path, key)
    } satisfies WorkbenchImportError;
  }

  return value;
}

function readEnum<T extends string>(
  record: RawRecord,
  key: string,
  path: string,
  values: Set<T>
): T {
  const value = readString(record, key, path);

  if (!values.has(value as T)) {
    throw {
      code: "invalid_enum",
      message: `Invalid value for ${getPath(path, key)}: ${value}`,
      path: getPath(path, key)
    } satisfies WorkbenchImportError;
  }

  return value as T;
}

function readNullableNumber(record: RawRecord, key: string, path: string): number | null {
  const value = getRequiredField(record, key, path);

  if (typeof value === "number" || value === null) {
    return value;
  }

  throw {
    code: "invalid_shape",
    message: `Expected ${getPath(path, key)} to be a number or null`,
    path: getPath(path, key)
  } satisfies WorkbenchImportError;
}

function readRound(value: unknown, path: string): RoundRecord {
  if (!isRecord(value)) {
    throw {
      code: "invalid_shape",
      message: `Expected ${path} to be an object`,
      path
    } satisfies WorkbenchImportError;
  }

  return {
    id: readString(value, "id", path),
    name: readString(value, "name", path),
    scheduledAt: readNullableString(value, "scheduledAt", path),
    status: readEnum(value, "status", path, ROUND_STATUSES),
    notes: readString(value, "notes", path)
  };
}

function readNegotiationSnapshot(value: unknown, path: string): NegotiationSnapshot {
  if (!isRecord(value)) {
    throw {
      code: "invalid_shape",
      message: `Expected ${path} to be an object`,
      path
    } satisfies WorkbenchImportError;
  }

  const version = getRequiredField(value, "version", path);
  if (typeof version !== "number" || !Number.isFinite(version)) {
    throw {
      code: "invalid_shape",
      message: `Expected ${getPath(path, "version")} to be a number`,
      path: getPath(path, "version")
    } satisfies WorkbenchImportError;
  }

  return {
    id: readString(value, "id", path),
    version,
    createdAt: readString(value, "createdAt", path),
    title: readString(value, "title", path),
    level: readString(value, "level", path),
    city: readString(value, "city", path),
    workMode: readString(value, "workMode", path),
    baseMonthlySalary: readNullableNumber(value, "baseMonthlySalary", path),
    salaryMonths: readNullableNumber(value, "salaryMonths", path),
    annualBonusCash: readNullableNumber(value, "annualBonusCash", path),
    signOnBonus: readNullableNumber(value, "signOnBonus", path),
    relocationBonus: readNullableNumber(value, "relocationBonus", path),
    equityShares: readNullableNumber(value, "equityShares", path),
    equityStrikePrice: readNullableNumber(value, "equityStrikePrice", path),
    equityReferencePrice: readNullableNumber(value, "equityReferencePrice", path),
    equityVestingYears: readNullableNumber(value, "equityVestingYears", path),
    deadline: readNullableString(value, "deadline", path),
    hrSignal: readString(value, "hrSignal", path),
    notes: readString(value, "notes", path)
  };
}

function readNegotiation(value: unknown, path: string): CompensationNegotiation {
  if (!isRecord(value)) {
    return createEmptyNegotiation();
  }

  return {
    status: readEnum(value, "status", path, NEGOTIATION_STATUSES),
    sourceProcessId: readNullableString(value, "sourceProcessId", path),
    startedAt: readNullableString(value, "startedAt", path),
    endedAt: readNullableString(value, "endedAt", path),
    latestSnapshotId: readNullableString(value, "latestSnapshotId", path),
    snapshots: readArray(value, "snapshots", path).map((snapshot, index) =>
      readNegotiationSnapshot(snapshot, `${getPath(path, "snapshots")}[${index}]`)
    )
  };
}

function readProcess(value: unknown, path: string): InterviewProcess {
  if (!isRecord(value)) {
    throw {
      code: "invalid_shape",
      message: `Expected ${path} to be an object`,
      path
    } satisfies WorkbenchImportError;
  }

  return {
    id: readString(value, "id", path),
    roleName: readString(value, "roleName", path),
    nextStep: readString(value, "nextStep", path),
    status: readEnum(value, "status", path, PROCESS_STATUSES),
    rounds: readArray(value, "rounds", path).map((round, index) =>
      readRound(round, `${getPath(path, "rounds")}[${index}]`)
    )
  };
}

function mergeLegacyImpressionFields(
  overallImpression: string,
  highlights: string | null,
  risks: string | null
) {
  return [
    overallImpression.trim(),
    highlights?.trim() ? `亮点：${highlights.trim()}` : null,
    risks?.trim() ? `风险：${risks.trim()}` : null
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

function readCompany(value: unknown, path: string): CompanyRecord {
  if (!isRecord(value)) {
    throw {
      code: "invalid_shape",
      message: `Expected ${path} to be an object`,
      path
    } satisfies WorkbenchImportError;
  }

  const overallImpression = readString(value, "overallImpression", path);

  return {
    id: readString(value, "id", path),
    name: readString(value, "name", path),
    companyType: readEnum(value, "companyType", path, COMPANY_TYPES),
    overallImpression: mergeLegacyImpressionFields(
      overallImpression,
      readOptionalString(value, "highlights"),
      readOptionalString(value, "risks")
    ),
    processes: readArray(value, "processes", path).map((process, index) =>
      readProcess(process, `${getPath(path, "processes")}[${index}]`)
    ),
    negotiation: readNegotiation(value.negotiation, getPath(path, "negotiation"))
  };
}

function normalizeGroupingMode(value: string): GroupingMode {
  if (value === "priority") {
    return "companyType";
  }

  if (!GROUPING_MODES.has(value as GroupingMode)) {
    throw {
      code: "invalid_enum",
      message: `Invalid value for grouping: ${value}`,
      path: "grouping"
    } satisfies WorkbenchImportError;
  }

  return value as GroupingMode;
}

export function createEmptyWorkbenchSnapshot(): WorkbenchSnapshot {
  return {
    version: 2,
    grouping: "companyType",
    companies: []
  };
}

export function parseWorkbenchSnapshotImport(raw: string): WorkbenchImportResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      error: {
        code: "invalid_json",
        message: "Import content is not valid JSON"
      }
    };
  }

  if (!isRecord(parsed)) {
    return {
      ok: false,
      error: {
        code: "invalid_shape",
        message: "Expected the imported snapshot to be an object"
      }
    };
  }

  try {
    if ("version" in parsed && parsed.version !== 2) {
      throw {
        code: "invalid_shape",
        message: "Only snapshot version 2 is supported",
        path: "version"
      } satisfies WorkbenchImportError;
    }

    return {
      ok: true,
      snapshot: {
        version: 2,
        grouping: normalizeGroupingMode(readString(parsed, "grouping", "")),
        companies: readArray(parsed, "companies", "").map((company, index) =>
          readCompany(company, `companies[${index}]`)
        )
      }
    };
  } catch (error) {
    return {
      ok: false,
      error: error as WorkbenchImportError
    };
  }
}

export function loadWorkbenchSnapshot(): WorkbenchSnapshot | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  const result = parseWorkbenchSnapshotImport(raw);

  return result.ok ? result.snapshot : null;
}

export function saveWorkbenchSnapshot(snapshot: WorkbenchSnapshot) {
  window.localStorage.setItem(STORAGE_KEY, serializeWorkbenchSnapshot(snapshot));
}

export function serializeWorkbenchSnapshot(snapshot: WorkbenchSnapshot) {
  return JSON.stringify(normalizeSnapshotForExport(snapshot), null, 2);
}

export function getWorkbenchExportFilename(now: Date = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `oh-my-todo-${year}-${month}-${day}.json`;
}
