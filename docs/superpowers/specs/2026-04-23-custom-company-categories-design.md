# Custom Company Categories Design

## Context

The workbench currently treats company type as a fixed enum with two values:
`startup` and `big-tech`. That assumption appears in the TypeScript model,
storage import validation, sample data, grouping selectors, the new-company
form, company-card editing, and localized labels.

The desired behavior is broader: each company still belongs to exactly one
category, but the user can maintain their own category list. The initial
categories remain "创业公司" and "大厂", but they are just starter data.

## Goals

- Keep the model simple: one company has one category.
- Let the user add custom categories such as "外企", "国企", "中厂", or
  "朋友推荐".
- Let the user rename starter categories.
- Let the user reorder categories so board grouping follows their preferred
  order.
- Allow deleting only empty categories so existing companies never lose a
  visible category.
- Preserve existing local data and JSON exports through a migration path.
- Keep the UI lightweight and close to the existing company-type grouping flow.

## Non-Goals

- Do not build a multi-label tagging system.
- Do not support one company belonging to multiple categories.
- Do not merge category sets across multiple imported files. Import keeps the
  current whole-snapshot replacement behavior.
- Do not add per-category colors or icons in this iteration.
- Do not rename every code symbol from `companyType` to `categoryId` in the
  first implementation. The stored field can keep its existing name while its
  meaning changes to "company category id".

## Data Model

Add a snapshot-level category list:

```ts
export interface CompanyCategory {
  id: string;
  name: string;
  order: number;
}

export interface WorkbenchSnapshotV3 {
  version: 3;
  grouping: GroupingMode;
  companyCategories: CompanyCategory[];
  companies: CompanyRecord[];
}
```

`CompanyRecord.companyType` remains a string id that points at
`companyCategories[].id`:

```ts
export interface CompanyRecord {
  id: string;
  name: string;
  companyType: string;
  overallImpression: string;
  processes: InterviewProcess[];
  negotiation: CompensationNegotiation;
}
```

The default category list is:

```ts
[
  { id: "startup", name: "创业公司", order: 0 },
  { id: "big-tech", name: "大厂", order: 1 }
]
```

Category ids are stable and independent of the display name. Renaming a
category changes the label everywhere without touching each company record.

Category names are treated as user data. The language toggle continues to
localize surrounding UI chrome, but custom category names are displayed exactly
as saved. This avoids surprising automatic translation for user-created labels.

## Storage And Migration

The app should serialize new snapshots as `version: 3`.

The importer should accept:

- version 2 snapshots without `companyCategories`
- version 3 snapshots with `companyCategories`

Version 2 import and old localStorage load behavior:

- add the default category list
- keep existing `company.companyType` values
- continue accepting only the legacy ids `startup` and `big-tech` for version 2
- normalize negotiation blocks the same way the current storage layer does
- save back as version 3 on the next normal persistence cycle

Version 3 import validation:

- `companyCategories` must be a non-empty array
- every category id must be a non-empty string
- every category name must be a non-empty string after trimming
- category ids must be unique
- category names must be unique after trimming
- `order` must be a finite number
- every company `companyType` must reference an existing category id

Invalid imports should keep the current snapshot unchanged and return the
existing structured import error shape.

## UI Entry And Interactions

Add a lightweight category management entry near the grouping controls. The
current grouping tabs stay close to the user's mental model:

- "公司类型" / "Company Type"
- "流程阶段" / "Stage"

When the user is in or near the company-type grouping flow, show a small
"管理分类" / "Manage Categories" action.

The category manager opens as a dialog or compact panel and supports:

- adding a category
- renaming a category
- moving a category up or down
- deleting an empty category

Deletion rules:

- a category with one or more companies cannot be deleted
- the last remaining category cannot be deleted
- blocked delete controls should explain that companies must be moved first

Validation rules:

- new and edited names are trimmed
- blank names are rejected
- duplicate names are rejected after trimming
- duplicate ids are never user-editable because ids are generated internally

## Company Creation And Editing

The new-company form reads options from `snapshot.companyCategories` instead of
hardcoded startup / big-tech options.

The initial draft should use the first category by order. With the default
snapshot, this is still `startup`.

Company-card summary editing uses the same category list. Changing the
selection updates only that company record.

If a category is renamed, no company mutation is required. The board title and
all dropdown labels update because they resolve through the category list.

## Grouping Behavior

`getGroupedCompanies` should accept category configuration when grouping by
company type.

When `grouping === "companyType"`:

- bucket active companies by `company.companyType`
- sort group buckets by `companyCategories.order`
- display each group with the configured category name
- omit empty categories from the board

When `grouping === "stage"`, keep the existing derived progress behavior.
Stored categories do not affect stage grouping.

The existing "company type" grouping mode name can remain unchanged for this
iteration. It is familiar and avoids extra language churn.

## Hook And Mutation Shape

`useInterviewWorkbench` should expose category-aware state and actions:

- `companyCategories`
- `createCompanyCategory(name)`
- `renameCompanyCategory(categoryId, name)`
- `moveCompanyCategory(categoryId, direction)`
- `deleteCompanyCategory(categoryId)`

Category mutations should live beside existing state mutations, likely in
`src/lib/mutations.ts`, unless implementation reveals a cleaner split such as
`src/lib/companyCategories.ts`.

The hook should pass categories into selectors and into form/card components.

## Error Handling

Category manager errors should be local and recoverable:

- blank name: keep the dialog open and show a field-level error
- duplicate name: keep the dialog open and show a field-level error
- delete non-empty category: disable the action and show a short reason
- delete last category: disable the action and show a short reason

Storage import errors should use the current import notice path. The app should
not partially import categories or companies when validation fails.

If localStorage contains corrupted data, the current fallback behavior remains:
load returns null and the app starts from an empty snapshot with default
categories.

## Testing Plan

Storage tests:

- version 2 snapshots import with default categories added
- version 3 snapshots export and import categories
- duplicate category ids fail import
- blank category names fail import
- companies referencing missing category ids fail import
- corrupted localStorage still falls back to a default empty snapshot

Selector tests:

- active companies group by custom category names
- group order follows `companyCategories.order`
- empty categories do not render as groups
- stage grouping still uses derived progress only

Mutation tests:

- create category trims names and assigns a stable id
- rename category updates the category list without touching companies
- duplicate or blank category names are rejected
- moving categories changes order
- deleting an empty category succeeds
- deleting a non-empty category is blocked
- deleting the last category is blocked

Component and app tests:

- new-company form renders dynamic category options
- new-company form defaults to the first ordered category
- company-card editor renders dynamic category options
- category manager supports add, rename, move, and empty delete flows
- blocked delete state is visible for categories with companies
- importing old JSON upgrades into the new category-aware snapshot

Build verification:

- run `npm run test`
- run `npm run build`

Local delivery verification after implementation:

- sync the built `dist/` output to `/Users/blue/Desktop/code/oh_my_todo_local/app`
- sync the same built output to
  `/Users/blue/Desktop/面试工作台.app/Contents/Resources/local/app`
- verify the synced app assets match the build output

## Acceptance Criteria

- A user can create a custom category and assign a company to it.
- A user can rename "创业公司" or "大厂" and see the new name reflected in the
  board and dropdowns.
- A user can reorder categories and see company-type grouping follow that
  order.
- A user cannot delete a category while companies still use it.
- Existing local data opens without manual migration.
- Old JSON exports import successfully.
- New JSON exports include category configuration.
- Tests and build pass before the feature is considered complete.
