# Custom Company Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user-managed company categories while keeping each company assigned to exactly one category.

**Architecture:** Introduce snapshot-level `companyCategories` and keep `CompanyRecord.companyType` as the stable category id for the first implementation. Storage migrates v2 and legacy snapshots into v3, selectors resolve group labels from category config, and UI components receive category options from the workbench hook instead of hardcoded startup / big-tech values.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, browser `localStorage`, existing local static packaging targets.

---

## File Structure

- Modify `src/types/interview.ts`
  - Add `CompanyCategory`.
  - Change `CompanyType` from a narrow enum to `string`.
  - Add `companyCategories` to workbench snapshots through storage types.
- Modify `src/lib/storage.ts`
  - Add default category constants.
  - Parse v2 snapshots and legacy no-version snapshots into v3 snapshots.
  - Validate v3 category shape and company references.
  - Serialize category config for export.
- Modify `src/lib/storage.test.ts`
  - Update existing v2 expectations to expect v3 migration.
  - Add invalid category import coverage.
- Modify `src/lib/selectors.ts`
  - Accept `CompanyCategory[]` for company-type grouping.
  - Use category order and labels when grouping by company type.
- Modify `src/lib/selectors.test.ts`
  - Add custom category group ordering and empty-category coverage.
  - Keep stage grouping regression coverage.
- Modify `src/lib/mutations.ts`
  - Add category mutation helpers.
  - Keep company creation and summary mutation behavior unchanged except for accepting dynamic category ids.
- Modify `src/lib/mutations.test.ts`
  - Add category mutation coverage.
- Modify `src/hooks/useInterviewWorkbench.ts`
  - Expose `companyCategories`.
  - Wire category mutations into snapshot state.
  - Pass categories into grouping selector.
- Modify `src/components/NewCompanyForm.tsx`
  - Accept `companyCategories`.
  - Default new drafts to first ordered category.
- Modify `src/components/CompanyCard.tsx`
  - Accept `companyCategories`.
  - Render dynamic category options.
- Modify `src/components/CompanyBoard.tsx`
  - Pass `companyCategories` to each card.
- Create `src/components/CategoryManager.tsx`
  - Manage add, rename, reorder, and delete-empty flows.
  - Keep validation local and visible.
- Create `src/components/CategoryManager.test.tsx`
  - Cover component-only category manager flows.
- Modify `src/components/GroupingTabs.tsx`
  - Add a nearby "管理分类" / "Manage Categories" action.
- Modify `src/App.tsx`
  - Own category manager dialog visibility.
  - Pass category config into form, board, and grouping tabs.
- Modify `src/App.test.tsx`
  - Cover the full add/rename/reorder/delete-blocked flows through shipped UI.
- Modify `src/styles/app.css`
  - Add compact category manager styles using existing button, field, panel, and dialog patterns.

## Task 1: Storage Model And Migration

**Files:**
- Modify: `src/types/interview.ts`
- Modify: `src/lib/storage.ts`
- Test: `src/lib/storage.test.ts`

- [ ] **Step 1: Write failing storage tests for v3 defaults and v2 migration**

Add these assertions to `src/lib/storage.test.ts`, updating the existing tests named "saves and loads the v2 workbench snapshot", "migrates legacy snapshots without a version field into v2", "parses a valid imported snapshot", "serializes snapshots for export using the same persisted shape", and "creates an empty v2 workbench snapshot":

```ts
const defaultCompanyCategories = [
  { id: "startup", name: "创业公司", order: 0 },
  { id: "big-tech", name: "大厂", order: 1 }
];

expect(snapshot?.version).toBe(3);
expect(snapshot?.companyCategories).toEqual(defaultCompanyCategories);

expect(result).toEqual({
  ok: true,
  snapshot: {
    version: 3,
    grouping: "companyType",
    companyCategories: defaultCompanyCategories,
    companies: sampleCompaniesWithNegotiation
  }
});

expect(createEmptyWorkbenchSnapshot()).toEqual({
  version: 3,
  grouping: "companyType",
  companyCategories: defaultCompanyCategories,
  companies: []
});
```

Add a new v3 import/export round-trip test:

```ts
it("round-trips v3 snapshots with custom company categories", () => {
  const snapshot = {
    version: 3 as const,
    grouping: "companyType" as const,
    companyCategories: [
      { id: "startup", name: "早期团队", order: 0 },
      { id: "foreign", name: "外企", order: 1 }
    ],
    companies: [
      {
        ...sampleCompanies[0],
        companyType: "foreign"
      }
    ]
  };

  const result = parseWorkbenchSnapshotImport(serializeWorkbenchSnapshot(snapshot));

  expect(result).toEqual({
    ok: true,
    snapshot
  });
});
```

- [ ] **Step 2: Write failing storage validation tests**

Add these tests to `src/lib/storage.test.ts`:

```ts
it("rejects duplicate category ids in v3 imports", () => {
  const result = parseWorkbenchSnapshotImport(
    JSON.stringify({
      version: 3,
      grouping: "companyType",
      companyCategories: [
        { id: "startup", name: "创业公司", order: 0 },
        { id: "startup", name: "早期团队", order: 1 }
      ],
      companies: []
    })
  );

  expect(result).toEqual({
    ok: false,
    error: expect.objectContaining({
      code: "invalid_shape",
      path: "companyCategories[1].id"
    })
  });
});

it("rejects blank category names in v3 imports", () => {
  const result = parseWorkbenchSnapshotImport(
    JSON.stringify({
      version: 3,
      grouping: "companyType",
      companyCategories: [{ id: "startup", name: "  ", order: 0 }],
      companies: []
    })
  );

  expect(result).toEqual({
    ok: false,
    error: expect.objectContaining({
      code: "invalid_shape",
      path: "companyCategories[0].name"
    })
  });
});

it("rejects duplicate category names after trimming", () => {
  const result = parseWorkbenchSnapshotImport(
    JSON.stringify({
      version: 3,
      grouping: "companyType",
      companyCategories: [
        { id: "startup", name: "外企", order: 0 },
        { id: "foreign", name: " 外企 ", order: 1 }
      ],
      companies: []
    })
  );

  expect(result).toEqual({
    ok: false,
    error: expect.objectContaining({
      code: "invalid_shape",
      path: "companyCategories[1].name"
    })
  });
});

it("rejects companies that reference missing category ids", () => {
  const result = parseWorkbenchSnapshotImport(
    JSON.stringify({
      version: 3,
      grouping: "companyType",
      companyCategories: [{ id: "startup", name: "创业公司", order: 0 }],
      companies: [
        {
          ...sampleCompanies[2],
          companyType: "missing"
        }
      ]
    })
  );

  expect(result).toEqual({
    ok: false,
    error: expect.objectContaining({
      code: "invalid_enum",
      path: "companies[0].companyType"
    })
  });
});
```

- [ ] **Step 3: Run storage tests and verify failure**

Run:

```bash
npm run test -- src/lib/storage.test.ts
```

Expected: FAIL because snapshots are still version 2 and `companyCategories` is not parsed.

- [ ] **Step 4: Implement types and storage migration**

Update `src/types/interview.ts`:

```ts
export type GroupingMode = "companyType" | "stage";
export type CompanyType = string;

export interface CompanyCategory {
  id: string;
  name: string;
  order: number;
}
```

Update `src/lib/storage.ts` imports to include `CompanyCategory`.

Add these constants and helpers near the current storage constants:

```ts
export const DEFAULT_COMPANY_CATEGORIES: CompanyCategory[] = [
  { id: "startup", name: "创业公司", order: 0 },
  { id: "big-tech", name: "大厂", order: 1 }
];

const LEGACY_COMPANY_TYPES = new Set<CompanyType>(DEFAULT_COMPANY_CATEGORIES.map((category) => category.id));
```

Change snapshot types:

```ts
export interface WorkbenchSnapshotV3 {
  version: 3;
  grouping: GroupingMode;
  companyCategories: CompanyCategory[];
  companies: CompanyRecord[];
}

export type WorkbenchSnapshot = WorkbenchSnapshotV3;
```

Add category readers:

```ts
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
```

Change `readCompany` to accept allowed category ids:

```ts
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
```

Change `createEmptyWorkbenchSnapshot`:

```ts
export function createEmptyWorkbenchSnapshot(): WorkbenchSnapshot {
  return {
    version: 3,
    grouping: "companyType",
    companyCategories: DEFAULT_COMPANY_CATEGORIES,
    companies: []
  };
}
```

Change `parseWorkbenchSnapshotImport` snapshot parsing:

```ts
const parsedVersion = "version" in parsed ? parsed.version : 2;

if (parsedVersion !== 2 && parsedVersion !== 3) {
  throw {
    code: "invalid_shape",
    message: "Only snapshot versions 2 and 3 are supported",
    path: "version"
  } satisfies WorkbenchImportError;
}

const companyCategories =
  parsedVersion === 3 ? readCompanyCategories(parsed) : DEFAULT_COMPANY_CATEGORIES;
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
```

- [ ] **Step 5: Run storage tests and verify pass**

Run:

```bash
npm run test -- src/lib/storage.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit storage migration**

Run:

```bash
git add src/types/interview.ts src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat: migrate workbench snapshots to company categories"
```

## Task 2: Category Selectors And Mutations

**Files:**
- Modify: `src/lib/selectors.ts`
- Modify: `src/lib/selectors.test.ts`
- Modify: `src/lib/mutations.ts`
- Modify: `src/lib/mutations.test.ts`

- [ ] **Step 1: Write failing selector tests**

Add to `src/lib/selectors.test.ts`:

```ts
const customCategories = [
  { id: "foreign", name: "外企", order: 0 },
  { id: "startup", name: "早期团队", order: 1 },
  { id: "empty", name: "空分类", order: 2 },
  { id: "big-tech", name: "大厂", order: 3 }
];

it("groups active companies by custom company categories", () => {
  const groups = getGroupedCompanies(
    [
      { ...sampleCompanies[0], companyType: "foreign" },
      ...sampleCompanies.slice(1)
    ],
    "companyType",
    customCategories
  );

  expect(groups.map((group) => group.label)).toEqual(["外企", "早期团队", "大厂"]);
  expect(groups.map((group) => group.key)).toEqual(["foreign", "startup", "big-tech"]);
  expect(groups.flatMap((group) => group.companies.map((company) => company.name))).toContain("ACME");
});

it("keeps derived stage grouping independent from category configuration", () => {
  const groups = getGroupedCompanies(sampleCompanies, "stage", customCategories);

  expect(groups.map((group) => group.label)).toEqual(["筛选中", "面试中", "谈薪中"]);
});
```

- [ ] **Step 2: Write failing mutation tests**

Update imports in `src/lib/mutations.test.ts`:

```ts
import {
  addRoundToProcess,
  archiveProcessById,
  createCompanyCategory,
  createCompanyWithProcess,
  deleteCompanyCategory,
  deleteNegotiationSnapshot,
  finishNegotiation,
  moveCompanyCategory,
  renameCompanyCategory,
  saveNegotiationSnapshot,
  startNegotiation,
  updateProcessRecord,
  updateCompanySummary,
  updateRoundRecord
} from "./mutations";
```

Add tests:

```ts
const defaultCategories = [
  { id: "startup", name: "创业公司", order: 0 },
  { id: "big-tech", name: "大厂", order: 1 }
];

it("creates a trimmed company category with a generated id", () => {
  const next = createCompanyCategory(defaultCategories, " 外企 ");

  expect(next.ok).toBe(true);
  expect(next.ok && next.categories).toHaveLength(3);
  expect(next.ok && next.categories[2]).toMatchObject({
    name: "外企",
    order: 2
  });
  expect(next.ok && next.categories[2].id).toMatch(/^category-/);
});

it("rejects blank and duplicate category names", () => {
  expect(createCompanyCategory(defaultCategories, " ")).toEqual({
    ok: false,
    error: "blank"
  });
  expect(createCompanyCategory(defaultCategories, " 创业公司 ")).toEqual({
    ok: false,
    error: "duplicate"
  });
});

it("renames a category without touching company records", () => {
  const result = renameCompanyCategory(defaultCategories, "startup", "早期团队");

  expect(result).toEqual({
    ok: true,
    categories: [
      { id: "startup", name: "早期团队", order: 0 },
      { id: "big-tech", name: "大厂", order: 1 }
    ]
  });
});

it("moves categories by one slot and normalizes order", () => {
  const result = moveCompanyCategory(
    [
      ...defaultCategories,
      { id: "foreign", name: "外企", order: 2 }
    ],
    "foreign",
    "up"
  );

  expect(result).toEqual([
    { id: "startup", name: "创业公司", order: 0 },
    { id: "foreign", name: "外企", order: 1 },
    { id: "big-tech", name: "大厂", order: 2 }
  ]);
});

it("deletes only empty categories and keeps at least one category", () => {
  expect(deleteCompanyCategory(defaultCategories, sampleCompanies, "big-tech")).toEqual({
    ok: false,
    error: "in-use"
  });

  expect(deleteCompanyCategory([defaultCategories[0]], [], "startup")).toEqual({
    ok: false,
    error: "last-category"
  });

  expect(
    deleteCompanyCategory(
      [...defaultCategories, { id: "foreign", name: "外企", order: 2 }],
      sampleCompanies,
      "foreign"
    )
  ).toEqual({
    ok: true,
    categories: defaultCategories
  });
});
```

- [ ] **Step 3: Run selector and mutation tests and verify failure**

Run:

```bash
npm run test -- src/lib/selectors.test.ts src/lib/mutations.test.ts
```

Expected: FAIL because selectors do not accept category config and mutation helpers do not exist.

- [ ] **Step 4: Implement selector grouping**

Update `src/lib/selectors.ts` imports to include `CompanyCategory`.

Add:

```ts
const STAGE_GROUP_LABELS: Record<string, string> = {
  screening: "筛选中",
  interviewing: "面试中",
  negotiating: "谈薪中"
};

const STAGE_GROUP_ORDER = ["screening", "interviewing", "negotiating"];
```

Replace hardcoded company-type label/order usage in `getGroupedCompanies`:

```ts
export function getGroupedCompanies(
  companies: CompanyRecord[],
  grouping: GroupingMode,
  companyCategories: CompanyCategory[] = []
): CompanyGroup[] {
  const activeCompanies = getActiveCompanies(companies);
  const buckets = new Map<string, CompanyRecord[]>();

  for (const company of activeCompanies) {
    const key = grouping === "companyType" ? company.companyType : getPrimaryStage(company);
    const bucket = buckets.get(key) ?? [];
    bucket.push(company);
    buckets.set(key, bucket);
  }

  if (grouping === "companyType") {
    return [...companyCategories]
      .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name))
      .filter((category) => buckets.has(category.id))
      .map((category) => ({
        key: category.id,
        label: category.name,
        companies: buckets.get(category.id) ?? []
      }));
  }

  return STAGE_GROUP_ORDER
    .filter((key) => buckets.has(key))
    .map((key) => ({
      key,
      label: STAGE_GROUP_LABELS[key],
      companies: buckets.get(key) ?? []
    }));
}
```

- [ ] **Step 5: Implement category mutation helpers**

Add to `src/lib/mutations.ts` imports:

```ts
CompanyCategory,
```

Add helpers near `createId`:

```ts
export type CategoryMutationError = "blank" | "duplicate" | "missing" | "in-use" | "last-category";
export type CategoryMutationResult =
  | { ok: true; categories: CompanyCategory[] }
  | { ok: false; error: CategoryMutationError };

function normalizeCategoryOrder(categories: CompanyCategory[]): CompanyCategory[] {
  return categories.map((category, index) => ({ ...category, order: index }));
}

function hasDuplicateCategoryName(categories: CompanyCategory[], name: string, exceptId?: string) {
  return categories.some(
    (category) => category.id !== exceptId && category.name.trim() === name
  );
}
```

Add exported functions:

```ts
export function createCompanyCategory(
  categories: CompanyCategory[],
  name: string
): CategoryMutationResult {
  const trimmedName = name.trim();
  if (!trimmedName) return { ok: false, error: "blank" };
  if (hasDuplicateCategoryName(categories, trimmedName)) return { ok: false, error: "duplicate" };

  return {
    ok: true,
    categories: normalizeCategoryOrder([
      ...categories,
      {
        id: createId("category", trimmedName),
        name: trimmedName,
        order: categories.length
      }
    ])
  };
}

export function renameCompanyCategory(
  categories: CompanyCategory[],
  categoryId: string,
  name: string
): CategoryMutationResult {
  const trimmedName = name.trim();
  if (!trimmedName) return { ok: false, error: "blank" };
  if (!categories.some((category) => category.id === categoryId)) return { ok: false, error: "missing" };
  if (hasDuplicateCategoryName(categories, trimmedName, categoryId)) {
    return { ok: false, error: "duplicate" };
  }

  return {
    ok: true,
    categories: normalizeCategoryOrder(
      categories.map((category) =>
        category.id === categoryId ? { ...category, name: trimmedName } : category
      )
    )
  };
}

export function moveCompanyCategory(
  categories: CompanyCategory[],
  categoryId: string,
  direction: "up" | "down"
): CompanyCategory[] {
  const sorted = [...categories].sort((left, right) => left.order - right.order);
  const index = sorted.findIndex((category) => category.id === categoryId);
  if (index === -1) return normalizeCategoryOrder(sorted);

  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= sorted.length) return normalizeCategoryOrder(sorted);

  const next = [...sorted];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return normalizeCategoryOrder(next);
}

export function deleteCompanyCategory(
  categories: CompanyCategory[],
  companies: CompanyRecord[],
  categoryId: string
): CategoryMutationResult {
  if (categories.length <= 1) return { ok: false, error: "last-category" };
  if (!categories.some((category) => category.id === categoryId)) return { ok: false, error: "missing" };
  if (companies.some((company) => company.companyType === categoryId)) {
    return { ok: false, error: "in-use" };
  }

  return {
    ok: true,
    categories: normalizeCategoryOrder(categories.filter((category) => category.id !== categoryId))
  };
}
```

- [ ] **Step 6: Run selector and mutation tests and verify pass**

Run:

```bash
npm run test -- src/lib/selectors.test.ts src/lib/mutations.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit selectors and mutations**

Run:

```bash
git add src/lib/selectors.ts src/lib/selectors.test.ts src/lib/mutations.ts src/lib/mutations.test.ts
git commit -m "feat: add category selectors and mutations"
```

## Task 3: Dynamic Category Options In Forms And Cards

**Files:**
- Modify: `src/components/NewCompanyForm.tsx`
- Modify: `src/components/CompanyCard.tsx`
- Modify: `src/components/CompanyBoard.tsx`
- Modify: `src/components/CompanyCard.test.tsx`
- Modify: `src/components/CompanyBoard.test.tsx`

- [ ] **Step 1: Write failing component tests**

In `src/components/CompanyCard.test.tsx`, pass category options in existing renders where category editing is asserted. Update the "saves the editable company fields" test:

```tsx
const companyCategories = [
  { id: "startup", name: "早期团队", order: 0 },
  { id: "foreign", name: "外企", order: 1 }
];

render(
  <CompanyCard
    company={{ ...company, companyType: "startup" }}
    companyCategories={companyCategories}
    onSaveSummary={onSaveSummary}
    onUpdateProcess={() => {}}
    onAddRound={() => {}}
    onArchiveProcess={() => {}}
    onUpdateRound={() => {}}
  />
);

await user.click(screen.getByRole("button", { name: "展开公司判断" }));
expect(screen.getByRole("option", { name: "早期团队" })).toBeInTheDocument();
expect(screen.getByRole("option", { name: "外企" })).toBeInTheDocument();
await user.selectOptions(screen.getByLabelText("公司类型"), "foreign");

expect(onSaveSummary).toHaveBeenCalledWith("acme", {
  name: "Aha",
  companyType: "foreign",
  overallImpression: "新的整体判断"
});
```

In `src/components/CompanyBoard.test.tsx`, update the first render to include category props:

```tsx
const companyCategories = [
  { id: "startup", name: "创业公司", order: 0 },
  { id: "big-tech", name: "大厂", order: 1 }
];

<CompanyBoard
  groups={[
    {
      key: "active",
      label: "进行中",
      companies: [sampleCompanies[1]]
    }
  ]}
  companyCategories={companyCategories}
  onSaveSummary={() => {}}
  onUpdateProcess={() => {}}
  onAddRound={() => {}}
  onArchiveProcess={() => {}}
  onUpdateRound={() => {}}
  negotiationSuggestionProcessIds={{ nova: "nova-product" }}
  onStartNegotiation={() => {}}
  onSaveNegotiationSnapshot={() => {}}
  onFinishNegotiation={() => {}}
/>

expect(passedProps).toMatchObject({
  companyCategories
});
```

- [ ] **Step 2: Run component tests and verify failure**

Run:

```bash
npm run test -- src/components/CompanyCard.test.tsx src/components/CompanyBoard.test.tsx
```

Expected: FAIL because `companyCategories` props are not defined or used.

- [ ] **Step 3: Update NewCompanyForm props and dynamic draft default**

Modify `src/components/NewCompanyForm.tsx`:

```ts
import { useEffect, useState } from "react";
import type { CompanyCategory, NewCompanyDraft } from "../types/interview";

function getInitialCategoryId(companyCategories: CompanyCategory[]) {
  return [...companyCategories].sort((left, right) => left.order - right.order)[0]?.id ?? "";
}

function createInitialDraft(companyCategories: CompanyCategory[]): NewCompanyDraft {
  return {
    companyName: "",
    companyType: getInitialCategoryId(companyCategories),
    roleName: ""
  };
}

interface NewCompanyFormProps {
  companyCategories: CompanyCategory[];
  onManageCategories: () => void;
  onSubmit: (draft: NewCompanyDraft) => void;
  onCancel?: () => void;
}
```

Update state initialization and reset:

```ts
const sortedCompanyCategories = [...companyCategories].sort(
  (left, right) => left.order - right.order || left.name.localeCompare(right.name)
);
const [draft, setDraft] = useState<NewCompanyDraft>(() => createInitialDraft(companyCategories));

useEffect(() => {
  setDraft((current) =>
    sortedCompanyCategories.some((category) => category.id === current.companyType)
      ? current
      : { ...current, companyType: getInitialCategoryId(sortedCompanyCategories) }
  );
}, [sortedCompanyCategories]);
```

Replace hardcoded options with:

```tsx
{sortedCompanyCategories.map((category) => (
  <option key={category.id} value={category.id}>
    {category.name}
  </option>
))}
```

Render a category management action beside the category field so empty-state users can create a custom category before saving the first company:

```tsx
<div className="composer-field__inline-actions">
  <button className="button button--ghost" type="button" onClick={onManageCategories}>
    {copy.manageCategories}
  </button>
</div>
```

Add localized copy values:

```ts
manageCategories: "Manage Categories"
```

and:

```ts
manageCategories: "管理分类"
```

On successful submit:

```ts
setDraft(createInitialDraft(companyCategories));
```

- [ ] **Step 4: Update CompanyCard props and dynamic options**

Modify `src/components/CompanyCard.tsx` imports:

```ts
CompanyCategory,
```

Add to props:

```ts
companyCategories: CompanyCategory[];
```

Create sorted options before return:

```ts
const sortedCompanyCategories = [...props.companyCategories].sort(
  (left, right) => left.order - right.order || left.name.localeCompare(right.name)
);
```

Replace hardcoded options:

```tsx
{sortedCompanyCategories.map((category) => (
  <option key={category.id} value={category.id}>
    {category.name}
  </option>
))}
```

Remove unused `getCompanyTypeLabel` import.

- [ ] **Step 5: Update CompanyBoard to pass categories**

Modify `src/components/CompanyBoard.tsx` props:

```ts
import type {
  CompanyCategory,
  CompanyGroup,
  CompanyRecord,
  InterviewProcess,
  NegotiationSnapshot,
  NegotiationStatus,
  RoundRecord
} from "../types/interview";

interface CompanyBoardProps {
  groups: CompanyGroup[];
  companyCategories: CompanyCategory[];
  onSaveSummary: (companyId: string, patch: CompanySummaryPatch) => void;
  onAddRound: (companyId: string, processId: string) => void;
  onArchiveProcess: (companyId: string, processId: string, archiveNote: string) => void;
  onUpdateProcess: (
    companyId: string,
    processId: string,
    patch: Partial<Pick<InterviewProcess, "roleName">>
  ) => void;
  onUpdateRound: (
    companyId: string,
    processId: string,
    roundId: string,
    patch: Partial<RoundRecord>
  ) => void;
  negotiationSuggestionProcessIds?: Partial<Record<string, string | null>>;
  onStartNegotiation?: (companyId: string, processId: string) => void;
  onSaveNegotiationSnapshot?: (
    companyId: string,
    draft: Omit<NegotiationSnapshot, "id" | "version" | "createdAt">
  ) => void;
  onDeleteNegotiationSnapshot?: (companyId: string, snapshotId: string) => void;
  onFinishNegotiation?: (
    companyId: string,
    status: Extract<NegotiationStatus, "accepted" | "declined" | "terminated">
  ) => void;
}
```

Pass categories into `CompanyCard`:

```tsx
<CompanyCard
  key={company.id}
  company={company}
  companyCategories={companyCategories}
  onSaveSummary={onSaveSummary}
  onAddRound={onAddRound}
  onArchiveProcess={onArchiveProcess}
  onUpdateProcess={onUpdateProcess}
  onUpdateRound={onUpdateRound}
  negotiationSuggestionProcessId={negotiationSuggestionProcessIds?.[company.id] ?? null}
  onStartNegotiation={onStartNegotiation}
  onSaveNegotiationSnapshot={onSaveNegotiationSnapshot}
  onDeleteNegotiationSnapshot={onDeleteNegotiationSnapshot}
  onFinishNegotiation={onFinishNegotiation}
/>
```

- [ ] **Step 6: Run component tests and verify pass**

Run:

```bash
npm run test -- src/components/CompanyCard.test.tsx src/components/CompanyBoard.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit dynamic component options**

Run:

```bash
git add src/components/NewCompanyForm.tsx src/components/CompanyCard.tsx src/components/CompanyBoard.tsx src/components/CompanyCard.test.tsx src/components/CompanyBoard.test.tsx
git commit -m "feat: render dynamic company category options"
```

## Task 4: Category Manager Component

**Files:**
- Create: `src/components/CategoryManager.tsx`
- Create: `src/components/CategoryManager.test.tsx`
- Modify: `src/styles/app.css`

- [ ] **Step 1: Write failing CategoryManager tests**

Create `src/components/CategoryManager.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CategoryManager } from "./CategoryManager";
import type { CompanyCategory } from "../types/interview";

const categories: CompanyCategory[] = [
  { id: "startup", name: "创业公司", order: 0 },
  { id: "big-tech", name: "大厂", order: 1 },
  { id: "foreign", name: "外企", order: 2 }
];

describe("CategoryManager", () => {
  it("adds a trimmed category", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn(() => ({ ok: true as const }));

    render(
      <CategoryManager
        open
        companyCategories={categories}
        categoryUsage={{ startup: 1, "big-tech": 1, foreign: 0 }}
        onCreateCategory={onCreate}
        onRenameCategory={() => ({ ok: true as const })}
        onMoveCategory={() => {}}
        onDeleteCategory={() => ({ ok: true as const })}
        onClose={() => {}}
      />
    );

    await user.type(screen.getByLabelText("新分类名称"), " 中厂 ");
    await user.click(screen.getByRole("button", { name: "新增分类" }));

    expect(onCreate).toHaveBeenCalledWith(" 中厂 ");
  });

  it("shows a duplicate-name error from create", async () => {
    const user = userEvent.setup();

    render(
      <CategoryManager
        open
        companyCategories={categories}
        categoryUsage={{ startup: 1, "big-tech": 1, foreign: 0 }}
        onCreateCategory={() => ({ ok: false, error: "duplicate" })}
        onRenameCategory={() => ({ ok: true as const })}
        onMoveCategory={() => {}}
        onDeleteCategory={() => ({ ok: true as const })}
        onClose={() => {}}
      />
    );

    await user.type(screen.getByLabelText("新分类名称"), "创业公司");
    await user.click(screen.getByRole("button", { name: "新增分类" }));

    expect(screen.getByText("已经有同名分类。")).toBeInTheDocument();
  });

  it("renames and reorders categories", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn(() => ({ ok: true as const }));
    const onMove = vi.fn();

    render(
      <CategoryManager
        open
        companyCategories={categories}
        categoryUsage={{ startup: 1, "big-tech": 1, foreign: 0 }}
        onCreateCategory={() => ({ ok: true as const })}
        onRenameCategory={onRename}
        onMoveCategory={onMove}
        onDeleteCategory={() => ({ ok: true as const })}
        onClose={() => {}}
      />
    );

    const foreignRow = screen.getByDisplayValue("外企").closest(".category-manager__row") as HTMLElement;
    await user.clear(within(foreignRow).getByLabelText("分类名称 外企"));
    await user.type(within(foreignRow).getByLabelText("分类名称 外企"), "外资公司");
    await user.click(within(foreignRow).getByRole("button", { name: "保存 外企" }));
    await user.click(within(foreignRow).getByRole("button", { name: "上移 外企" }));

    expect(onRename).toHaveBeenCalledWith("foreign", "外资公司");
    expect(onMove).toHaveBeenCalledWith("foreign", "up");
  });

  it("blocks deleting categories that still have companies", async () => {
    render(
      <CategoryManager
        open
        companyCategories={categories}
        categoryUsage={{ startup: 1, "big-tech": 1, foreign: 0 }}
        onCreateCategory={() => ({ ok: true as const })}
        onRenameCategory={() => ({ ok: true as const })}
        onMoveCategory={() => {}}
        onDeleteCategory={() => ({ ok: true as const })}
        onClose={() => {}}
      />
    );

    const startupRow = screen.getByDisplayValue("创业公司").closest(".category-manager__row") as HTMLElement;
    expect(within(startupRow).getByRole("button", { name: "删除 创业公司" })).toBeDisabled();
    expect(within(startupRow).getByText("先把 1 家公司移到其他分类")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run CategoryManager tests and verify failure**

Run:

```bash
npm run test -- src/components/CategoryManager.test.tsx
```

Expected: FAIL because `CategoryManager` does not exist.

- [ ] **Step 3: Implement CategoryManager**

Create `src/components/CategoryManager.tsx`:

```tsx
import { useEffect, useState } from "react";
import { resolveAppLocale, type AppLocale } from "../lib/locale";
import type { CategoryMutationError } from "../lib/mutations";
import type { CompanyCategory } from "../types/interview";

type CategoryActionResult = { ok: true } | { ok: false; error: CategoryMutationError };

interface CategoryManagerProps {
  open: boolean;
  companyCategories: CompanyCategory[];
  categoryUsage: Record<string, number>;
  onCreateCategory: (name: string) => CategoryActionResult;
  onRenameCategory: (categoryId: string, name: string) => CategoryActionResult;
  onMoveCategory: (categoryId: string, direction: "up" | "down") => void;
  onDeleteCategory: (categoryId: string) => CategoryActionResult;
  onClose: () => void;
}

function getCopy(locale: AppLocale) {
  return locale === "en"
    ? {
        title: "Manage Categories",
        description: "Categories control the company-type lanes and the dropdowns on company cards.",
        newName: "New category name",
        add: "Add Category",
        close: "Close",
        categoryName: (name: string) => `Category name ${name}`,
        save: (name: string) => `Save ${name}`,
        moveUp: (name: string) => `Move up ${name}`,
        moveDown: (name: string) => `Move down ${name}`,
        delete: (name: string) => `Delete ${name}`,
        inUse: (count: number) => `Move ${count} companies to another category first`,
        empty: "No companies",
        errors: {
          blank: "Category name cannot be blank.",
          duplicate: "A category with this name already exists.",
          missing: "This category no longer exists.",
          "in-use": "Move companies to another category first.",
          "last-category": "Keep at least one category."
        }
      }
    : {
        title: "管理分类",
        description: "分类会影响公司类型分组和公司卡片里的下拉选项。",
        newName: "新分类名称",
        add: "新增分类",
        close: "关闭",
        categoryName: (name: string) => `分类名称 ${name}`,
        save: (name: string) => `保存 ${name}`,
        moveUp: (name: string) => `上移 ${name}`,
        moveDown: (name: string) => `下移 ${name}`,
        delete: (name: string) => `删除 ${name}`,
        inUse: (count: number) => `先把 ${count} 家公司移到其他分类`,
        empty: "暂无公司",
        errors: {
          blank: "分类名称不能为空。",
          duplicate: "已经有同名分类。",
          missing: "这个分类已经不存在。",
          "in-use": "先把公司移到其他分类。",
          "last-category": "至少保留一个分类。"
        }
      };
}

export function CategoryManager({
  open,
  companyCategories,
  categoryUsage,
  onCreateCategory,
  onRenameCategory,
  onMoveCategory,
  onDeleteCategory,
  onClose
}: CategoryManagerProps) {
  const locale = resolveAppLocale();
  const copy = getCopy(locale);
  const sortedCategories = [...companyCategories].sort((left, right) => left.order - right.order);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraftNames(Object.fromEntries(sortedCategories.map((category) => [category.id, category.name])));
  }, [companyCategories]);

  if (!open) return null;

  function showResult(result: CategoryActionResult) {
    if (result.ok) {
      setError(null);
      return true;
    }

    setError(copy.errors[result.error]);
    return false;
  }

  return (
    <div className="category-manager__backdrop" role="presentation">
      <section className="category-manager" role="dialog" aria-modal="true" aria-label={copy.title}>
        <div className="category-manager__header">
          <div>
            <h2>{copy.title}</h2>
            <p>{copy.description}</p>
          </div>
          <button className="button button--ghost" type="button" onClick={onClose}>
            {copy.close}
          </button>
        </div>

        <div className="category-manager__create">
          <label>
            <span>{copy.newName}</span>
            <input
              aria-label={copy.newName}
              className="field field--input"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
            />
          </label>
          <button
            className="button button--primary"
            type="button"
            onClick={() => {
              if (showResult(onCreateCategory(newCategoryName))) {
                setNewCategoryName("");
              }
            }}
          >
            {copy.add}
          </button>
        </div>

        {error ? (
          <p className="category-manager__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="category-manager__list">
          {sortedCategories.map((category, index) => {
            const usage = categoryUsage[category.id] ?? 0;
            const deleteDisabled = usage > 0 || sortedCategories.length <= 1;
            return (
              <div className="category-manager__row" key={category.id}>
                <input
                  aria-label={copy.categoryName(category.name)}
                  className="field field--input"
                  value={draftNames[category.id] ?? category.name}
                  onChange={(event) =>
                    setDraftNames((current) => ({ ...current, [category.id]: event.target.value }))
                  }
                />
                <span className="category-manager__usage">
                  {usage > 0 ? copy.inUse(usage) : copy.empty}
                </span>
                <div className="category-manager__actions">
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() => showResult(onRenameCategory(category.id, draftNames[category.id] ?? ""))}
                  >
                    {copy.save(category.name)}
                  </button>
                  <button
                    aria-label={copy.moveUp(category.name)}
                    className="button button--ghost"
                    disabled={index === 0}
                    type="button"
                    onClick={() => onMoveCategory(category.id, "up")}
                  >
                    ↑
                  </button>
                  <button
                    aria-label={copy.moveDown(category.name)}
                    className="button button--ghost"
                    disabled={index === sortedCategories.length - 1}
                    type="button"
                    onClick={() => onMoveCategory(category.id, "down")}
                  >
                    ↓
                  </button>
                  <button
                    aria-label={copy.delete(category.name)}
                    className="button button--ghost button--danger"
                    disabled={deleteDisabled}
                    type="button"
                    onClick={() => showResult(onDeleteCategory(category.id))}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Add category manager styles**

Append to `src/styles/app.css`:

```css
.category-manager__backdrop {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(16, 24, 40, 0.36);
}

.category-manager {
  width: min(720px, 100%);
  max-height: min(720px, calc(100vh - 48px));
  overflow: auto;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  background: var(--surface-panel-strong);
  box-shadow: var(--shadow-panel);
  padding: 20px;
}

.category-manager__header,
.category-manager__create,
.category-manager__row,
.category-manager__actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.category-manager__header {
  justify-content: space-between;
  align-items: flex-start;
}

.category-manager__header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.category-manager__header p,
.category-manager__usage,
.category-manager__error {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.category-manager__create {
  margin-top: 18px;
  align-items: flex-end;
}

.category-manager__create label {
  flex: 1;
}

.category-manager__list {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.category-manager__row {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) minmax(150px, auto) auto;
  padding: 10px;
  border: 1px solid var(--line-subtle);
  border-radius: 8px;
  background: var(--surface-panel);
}

.category-manager__error {
  color: #8f3028;
}

@media (max-width: 720px) {
  .category-manager__row,
  .category-manager__create {
    display: grid;
    grid-template-columns: 1fr;
  }

  .category-manager__actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
```

- [ ] **Step 5: Run CategoryManager tests and verify pass**

Run:

```bash
npm run test -- src/components/CategoryManager.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit category manager**

Run:

```bash
git add src/components/CategoryManager.tsx src/components/CategoryManager.test.tsx src/styles/app.css
git commit -m "feat: add company category manager"
```

## Task 5: App-Level Integration

**Files:**
- Modify: `src/hooks/useInterviewWorkbench.ts`
- Modify: `src/components/GroupingTabs.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Write failing App tests**

In `src/App.test.tsx`, update `seedWorkbench` to save v3 snapshots or rely on v2 migration depending on the test. Add:

```tsx
it("manages custom categories from the workbench UI", async () => {
  seedWorkbench();
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: "管理分类" }));
  const dialog = screen.getByRole("dialog", { name: "管理分类" });

  await user.type(within(dialog).getByLabelText("新分类名称"), "外企");
  await user.click(within(dialog).getByRole("button", { name: "新增分类" }));
  expect(within(dialog).getByDisplayValue("外企")).toBeInTheDocument();

  await user.clear(within(dialog).getByLabelText("分类名称 创业公司"));
  await user.type(within(dialog).getByLabelText("分类名称 创业公司"), "早期团队");
  await user.click(within(dialog).getByRole("button", { name: "保存 创业公司" }));

  expect(await screen.findByRole("heading", { name: "早期团队" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "创业公司" })).not.toBeInTheDocument();
});

it("uses custom categories when creating and editing companies", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getAllByRole("button", { name: "新建第一个公司" })[0]);
  await user.click(screen.getByRole("button", { name: "管理分类" }));
  await user.type(screen.getByLabelText("新分类名称"), "外企");
  await user.click(screen.getByRole("button", { name: "新增分类" }));
  await user.click(screen.getByRole("button", { name: "关闭" }));

  await user.type(screen.getByLabelText("公司名称"), "Stripe");
  const companyTypeSelect = screen.getByLabelText("公司类型") as HTMLSelectElement;
  const foreignOption = [...companyTypeSelect.options].find((option) => option.textContent === "外企");
  expect(foreignOption).toBeDefined();
  await user.selectOptions(companyTypeSelect, foreignOption!.value);
  await user.type(screen.getByLabelText("岗位名称"), "Product Lead");
  await user.click(screen.getByRole("button", { name: "保存到工作台" }));

  expect(screen.getByText("Stripe")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "外企" })).toBeInTheDocument();
});
```

Add a blocked delete assertion to the first App test:

```tsx
const startupRow = within(dialog).getByDisplayValue("早期团队").closest(".category-manager__row") as HTMLElement;
expect(within(startupRow).getByRole("button", { name: "删除 早期团队" })).toBeDisabled();
expect(within(startupRow).getByText(/先把 .* 家公司移到其他分类/)).toBeInTheDocument();
```

- [ ] **Step 2: Run App tests and verify failure**

Run:

```bash
npm run test -- src/App.test.tsx
```

Expected: FAIL because the hook and UI do not expose category management.

- [ ] **Step 3: Integrate categories into the hook**

Update `src/hooks/useInterviewWorkbench.ts` imports:

```ts
createCompanyCategory,
deleteCompanyCategory,
moveCompanyCategory,
renameCompanyCategory,
```

Expose category usage and actions:

```ts
const companyCategories = snapshot.companyCategories;
const categoryUsage = useMemo(
  () =>
    Object.fromEntries(
      companyCategories.map((category) => [
        category.id,
        companies.filter((company) => company.companyType === category.id).length
      ])
    ),
  [companyCategories, companies]
);
```

Change grouped companies:

```ts
groupedCompanies: useMemo(
  () => getGroupedCompanies(companies, grouping, companyCategories),
  [companies, grouping, companyCategories]
),
```

Add returned fields and actions:

```ts
companyCategories,
categoryUsage,
createCompanyCategory: (name: string) => {
  let result: ReturnType<typeof createCompanyCategory> = { ok: false, error: "blank" };
  setSnapshot((current) => {
    result = createCompanyCategory(current.companyCategories, name);
    return result.ok ? { ...current, companyCategories: result.categories } : current;
  });
  return result.ok ? { ok: true as const } : { ok: false as const, error: result.error };
},
renameCompanyCategory: (categoryId: string, name: string) => {
  let result: ReturnType<typeof renameCompanyCategory> = { ok: false, error: "blank" };
  setSnapshot((current) => {
    result = renameCompanyCategory(current.companyCategories, categoryId, name);
    return result.ok ? { ...current, companyCategories: result.categories } : current;
  });
  return result.ok ? { ok: true as const } : { ok: false as const, error: result.error };
},
moveCompanyCategory: (categoryId: string, direction: "up" | "down") =>
  setSnapshot((current) => ({
    ...current,
    companyCategories: moveCompanyCategory(current.companyCategories, categoryId, direction)
  })),
deleteCompanyCategory: (categoryId: string) => {
  let result: ReturnType<typeof deleteCompanyCategory> = { ok: false, error: "missing" };
  setSnapshot((current) => {
    result = deleteCompanyCategory(current.companyCategories, current.companies, categoryId);
    return result.ok ? { ...current, companyCategories: result.categories } : current;
  });
  return result.ok ? { ok: true as const } : { ok: false as const, error: result.error };
},
```

- [ ] **Step 4: Add manage action to GroupingTabs**

Update `src/components/GroupingTabs.tsx` props:

```ts
onManageCategories: () => void;
```

Add localized copy:

```ts
manageCategories: "Manage Categories"
```

and Chinese:

```ts
manageCategories: "管理分类"
```

Render the action next to tabs:

```tsx
<button
  className="button button--ghost group-tabs__manage"
  type="button"
  onClick={onManageCategories}
>
  {copy.manageCategories}
</button>
```

- [ ] **Step 5: Integrate CategoryManager and dynamic props in App**

Update imports in `src/App.tsx`:

```ts
import { CategoryManager } from "./components/CategoryManager";
```

Add state:

```ts
const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
```

Pass categories into the form:

```tsx
<NewCompanyForm
  companyCategories={workbench.companyCategories}
  onManageCategories={() => setCategoryManagerOpen(true)}
  onSubmit={(draft) => {
    workbench.createCompanyWithProcess(draft);
    setShowComposer(false);
    setNotice({
      tone: "success",
      message: copy.createdNotice
    });
  }}
  onCancel={isEmpty ? undefined : () => setShowComposer(false)}
/>
```

Pass manage action into grouping tabs:

```tsx
<GroupingTabs
  value={workbench.grouping}
  onChange={workbench.setGrouping}
  onManageCategories={() => setCategoryManagerOpen(true)}
/>
```

Pass categories into the board:

```tsx
<CompanyBoard
  groups={workbench.groupedCompanies}
  companyCategories={workbench.companyCategories}
  onSaveSummary={workbench.updateCompanySummary}
  onAddRound={workbench.addRoundToProcess}
  negotiationSuggestionProcessIds={workbench.negotiationSuggestionProcessIds}
  onStartNegotiation={workbench.startNegotiation}
  onSaveNegotiationSnapshot={workbench.saveNegotiationSnapshot}
  onDeleteNegotiationSnapshot={workbench.deleteNegotiationSnapshot}
  onFinishNegotiation={workbench.finishNegotiation}
  onArchiveProcess={workbench.archiveProcessById}
  onUpdateProcess={workbench.updateProcessRecord}
  onUpdateRound={workbench.updateRoundRecord}
/>
```

Render category manager near the end of `<main>`:

```tsx
<CategoryManager
  open={categoryManagerOpen}
  companyCategories={workbench.companyCategories}
  categoryUsage={workbench.categoryUsage}
  onCreateCategory={workbench.createCompanyCategory}
  onRenameCategory={workbench.renameCompanyCategory}
  onMoveCategory={workbench.moveCompanyCategory}
  onDeleteCategory={workbench.deleteCompanyCategory}
  onClose={() => setCategoryManagerOpen(false)}
/>
```

Remove the `getGroupLabel` remapping from `App.tsx` for company type labels. Keep stage labels if needed by relying on selector labels:

```ts
const groupedCompanies = workbench.groupedCompanies;
```

- [ ] **Step 6: Run App tests and verify pass**

Run:

```bash
npm run test -- src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit App integration**

Run:

```bash
git add src/hooks/useInterviewWorkbench.ts src/components/GroupingTabs.tsx src/App.tsx src/App.test.tsx
git commit -m "feat: wire custom company categories into workbench"
```

## Task 6: Full Verification And Local Delivery Sync

**Files:**
- Verify: whole repository
- Sync target: `/Users/blue/Desktop/code/oh_my_todo_local/app`
- Sync target: `/Users/blue/Desktop/面试工作台.app/Contents/Resources/local/app`

- [ ] **Step 1: Run full test suite**

Run:

```bash
npm run test
```

Expected: PASS with all test files passing.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: PASS with TypeScript and Vite build completed.

- [ ] **Step 3: Sync the static local copy**

Run:

```bash
rsync -a --delete dist/ /Users/blue/Desktop/code/oh_my_todo_local/app/
```

Expected: exit code 0.

- [ ] **Step 4: Sync the macOS app bundle copy**

Run:

```bash
rsync -a --delete dist/ /Users/blue/Desktop/面试工作台.app/Contents/Resources/local/app/
```

Expected: exit code 0.

- [ ] **Step 5: Verify synced files match build output**

Run:

```bash
diff -qr dist /Users/blue/Desktop/code/oh_my_todo_local/app
diff -qr dist /Users/blue/Desktop/面试工作台.app/Contents/Resources/local/app
```

Expected: both commands print no differences and exit 0.

- [ ] **Step 6: Commit final verification updates if source files changed during verification**

Run:

```bash
git status --short
git add src/types/interview.ts src/lib/storage.ts src/lib/storage.test.ts src/lib/selectors.ts src/lib/selectors.test.ts src/lib/mutations.ts src/lib/mutations.test.ts src/hooks/useInterviewWorkbench.ts src/components/NewCompanyForm.tsx src/components/CompanyCard.tsx src/components/CompanyBoard.tsx src/components/CategoryManager.tsx src/components/CategoryManager.test.tsx src/components/GroupingTabs.tsx src/App.tsx src/App.test.tsx src/styles/app.css
git commit -m "chore: finalize custom category workbench"
```

Expected: commit succeeds if verification produced intentional source or test updates. If `git status --short` shows no source changes, skip the `git add` and `git commit` commands. Built local delivery targets live outside this repo and are not committed.

- [ ] **Step 7: Report final state**

Include:

```text
npm run test: pass
npm run build: pass
Local static copy synced: /Users/blue/Desktop/code/oh_my_todo_local/app
macOS app bundle synced: /Users/blue/Desktop/面试工作台.app/Contents/Resources/local/app
```

## Plan Self-Review

- Spec coverage: The plan covers single-category assignment, editable default categories, add/rename/reorder/delete-empty behavior, v2-to-v3 migration, v3 validation, dynamic form/card options, grouping order, tests, build verification, and local app sync.
- Scope check: The feature is one coherent subsystem. Category settings, storage, selectors, and UI all depend on the same category list and should ship together.
- Placeholder scan: The plan has no open-ended implementation instructions.
- Type consistency: The plan consistently uses `CompanyCategory`, `companyCategories`, `CompanyRecord.companyType`, and `WorkbenchSnapshotV3`.
