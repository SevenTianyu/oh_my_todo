import type {
  CompanyCategory,
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
export const DEFAULT_COMPANY_CATEGORIES: CompanyCategory[] = [
  { id: "startup", name: "创业公司", order: 0 },
  { id: "big-tech", name: "大厂", order: 1 }
];
function createDefaultCompanyCategories(): CompanyCategory[] {
  return DEFAULT_COMPANY_CATEGORIES.map((category) => ({ ...category }));
}
const LEGACY_COMPANY_TYPES = new Set<CompanyType>(
  DEFAULT_COMPANY_CATEGORIES.map((category) => category.id)
);
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

interface WorkbenchSnapshotV2 {
  version: 2;
  grouping: GroupingMode;
  companies: CompanyRecord[];
}

export interface WorkbenchSnapshotV3 {
  version: 3;
  grouping: GroupingMode;
  companyCategories: CompanyCategory[];
  companies: CompanyRecord[];
}

export type WorkbenchSnapshot = WorkbenchSnapshotV3;
type PersistableWorkbenchSnapshot = WorkbenchSnapshot | WorkbenchSnapshotV2;

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

function readOptionalNullableString(
  record: RawRecord,
  key: string,
  path: string
): string | null | undefined {
  if (!(key in record)) {
    return undefined;
  }

  const value = record[key];

  if (typeof value === "string" || value === null) {
    return value;
  }

  throw {
    code: "invalid_shape",
    message: `Expected ${getPath(path, key)} to be a string or null`,
    path: getPath(path, key)
  } satisfies WorkbenchImportError;
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

function normalizeSnapshotForExport(snapshot: PersistableWorkbenchSnapshot): WorkbenchSnapshot {
  return {
    version: 3,
    grouping: snapshot.grouping,
    companyCategories:
      snapshot.version === 3 ? snapshot.companyCategories : createDefaultCompanyCategories(),
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

function readFiniteNumber(record: RawRecord, key: string, path: string): number {
  const value = getRequiredField(record, key, path);

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  throw {
    code: "invalid_shape",
    message: `Expected ${getPath(path, key)} to be a finite number`,
    path: getPath(path, key)
  } satisfies WorkbenchImportError;
}

function readCompanyCategory(value: unknown, path: string): CompanyCategory {
  if (!isRecord(value)) {
    throw {
      code: "invalid_shape",
      message: `Expected ${path} to be an object`,
      path
    } satisfies WorkbenchImportError;
  }

  const id = readString(value, "id", path).trim();
  const name = readString(value, "name", path).trim();
  const order = readFiniteNumber(value, "order", path);

  if (!id) {
    throw {
      code: "invalid_shape",
      message: `Expected ${getPath(path, "id")} to be a non-empty string`,
      path: getPath(path, "id")
    } satisfies WorkbenchImportError;
  }

  if (!name) {
    throw {
      code: "invalid_shape",
      message: `Expected ${getPath(path, "name")} to be a non-empty string`,
      path: getPath(path, "name")
    } satisfies WorkbenchImportError;
  }

  return { id, name, order };
}

function readCompanyCategories(record: RawRecord): CompanyCategory[] {
  const categories = readArray(record, "companyCategories", "").map((category, index) =>
    readCompanyCategory(category, `companyCategories[${index}]`)
  );

  if (categories.length === 0) {
    throw {
      code: "invalid_shape",
      message: "Expected companyCategories to contain at least one category",
      path: "companyCategories"
    } satisfies WorkbenchImportError;
  }

  const seenIds = new Set<string>();
  const seenNames = new Set<string>();

  for (let index = 0; index < categories.length; index += 1) {
    const category = categories[index];
    if (seenIds.has(category.id)) {
      throw {
        code: "invalid_shape",
        message: `Duplicate company category id: ${category.id}`,
        path: `companyCategories[${index}].id`
      } satisfies WorkbenchImportError;
    }
    if (seenNames.has(category.name)) {
      throw {
        code: "invalid_shape",
        message: `Duplicate company category name: ${category.name}`,
        path: `companyCategories[${index}].name`
      } satisfies WorkbenchImportError;
    }
    seenIds.add(category.id);
    seenNames.add(category.name);
  }

  return categories;
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

function readOptionalNullableNumber(record: RawRecord, key: string, path: string): number | null | undefined {
  if (!(key in record)) {
    return undefined;
  }

  const value = record[key];

  if (typeof value === "number" || value === null) {
    return value;
  }

  throw {
    code: "invalid_shape",
    message: `Expected ${getPath(path, key)} to be a number or null`,
    path: getPath(path, key)
  } satisfies WorkbenchImportError;
}

function readEquityPerShareValue(record: RawRecord, path: string) {
  const directValue = readOptionalNullableNumber(record, "equityPerShareValue", path);

  if (typeof directValue !== "undefined") {
    return directValue;
  }

  const legacyStrikePrice = readOptionalNullableNumber(record, "equityStrikePrice", path);
  const legacyReferencePrice = readOptionalNullableNumber(record, "equityReferencePrice", path);

  if (typeof legacyStrikePrice === "undefined" && typeof legacyReferencePrice === "undefined") {
    return null;
  }

  if (legacyStrikePrice === null || legacyReferencePrice === null) {
    return null;
  }

  if (typeof legacyStrikePrice === "number" && typeof legacyReferencePrice === "number") {
    return Math.max(legacyReferencePrice - legacyStrikePrice, 0);
  }

  return null;
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
    equityPerShareValue: readEquityPerShareValue(value, path),
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

  const archiveNote = readOptionalNullableString(value, "archiveNote", path);
  const archivedAt = readOptionalNullableString(value, "archivedAt", path);

  return {
    id: readString(value, "id", path),
    roleName: readString(value, "roleName", path),
    nextStep: readString(value, "nextStep", path),
    status: readEnum(value, "status", path, PROCESS_STATUSES),
    ...(typeof archiveNote !== "undefined" ? { archiveNote } : {}),
    ...(typeof archivedAt !== "undefined" ? { archivedAt } : {}),
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

function readCompany(value: unknown, path: string, companyTypes: Set<CompanyType>): CompanyRecord {
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
    companyType: readEnum(value, "companyType", path, companyTypes),
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
    version: 3,
    grouping: "companyType",
    companyCategories: createDefaultCompanyCategories(),
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
    const parsedVersion = "version" in parsed ? parsed.version : 2;

    if (parsedVersion !== 2 && parsedVersion !== 3) {
      throw {
        code: "invalid_shape",
        message: "Only snapshot versions 2 and 3 are supported",
        path: "version"
      } satisfies WorkbenchImportError;
    }

    const companyCategories =
      parsedVersion === 3 ? readCompanyCategories(parsed) : createDefaultCompanyCategories();
    const categoryIds = new Set(companyCategories.map((category) => category.id));
    const allowedCompanyTypes = parsedVersion === 3 ? categoryIds : LEGACY_COMPANY_TYPES;

    return {
      ok: true,
      snapshot: {
        version: 3,
        grouping: normalizeGroupingMode(readString(parsed, "grouping", "")),
        companyCategories,
        companies: readArray(parsed, "companies", "").map((company, index) =>
          readCompany(company, `companies[${index}]`, allowedCompanyTypes)
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

export function saveWorkbenchSnapshot(snapshot: PersistableWorkbenchSnapshot) {
  window.localStorage.setItem(STORAGE_KEY, serializeWorkbenchSnapshot(snapshot));
}

export function serializeWorkbenchSnapshot(snapshot: PersistableWorkbenchSnapshot) {
  return JSON.stringify(normalizeSnapshotForExport(snapshot), null, 2);
}

export function getWorkbenchExportFilename(now: Date = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `oh-my-todo-${year}-${month}-${day}.json`;
}
