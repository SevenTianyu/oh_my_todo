# Interview Workbench Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个桌面 Web 的面试工作台原型，支持顶部未来 7 天面试时间区、可切换分组的活跃公司工作台、公司卡内联编辑，以及底部归档区。

**Architecture:** 使用 Vite + React + TypeScript 构建单页原型。领域模型按 `公司 -> 流程 -> 轮次` 三层组织，顶部时间区完全由轮次时间派生；页面状态由自定义 hook 管理，并通过 `localStorage` 持久化，确保视图分组不是底层数据结构。

**Tech Stack:** Vite, React, TypeScript, Vitest, React Testing Library, Playwright, localStorage, plain CSS

---

## 实施前提

- 当前目录 `/Users/blue/Desktop/code/oh_my_todo` 还不是 git 仓库。开始 Task 1 前，如果仍在本目录执行实现，先运行：

```bash
git init
```

- 如果后续改为在正式仓库的独立 worktree 中实现，保留以下路径结构，把相对路径映射到对应 worktree 即可。

## File Structure

- Create: `.gitignore` — 忽略依赖、构建产物、测试报告
- Create: `package.json` — 前端脚手架、测试和 e2e 命令
- Create: `tsconfig.json` — TypeScript 编译配置
- Create: `vite.config.ts` — Vite + Vitest 配置
- Create: `vitest.setup.ts` — Testing Library / jest-dom 初始化
- Create: `playwright.config.ts` — 浏览器端到端测试配置
- Create: `index.html` — Vite 入口文档
- Create: `README.md` — 运行、测试和原型边界说明
- Create: `src/main.tsx` — React 挂载入口
- Create: `src/App.tsx` — 页面装配根组件
- Create: `src/styles/app.css` — 原型全局样式
- Create: `src/types/interview.ts` — 公司、流程、轮次、分组、派生结果类型
- Create: `src/lib/sampleData.ts` — 手动录入原型的初始示例数据
- Create: `src/lib/selectors.ts` — 顶部时间区、分组列、归档列表等派生逻辑
- Create: `src/lib/mutations.ts` — 更新公司、流程、轮次的纯函数
- Create: `src/lib/storage.ts` — `localStorage` 读写封装
- Create: `src/hooks/useInterviewWorkbench.ts` — 工作台状态与操作封装
- Create: `src/components/UpcomingTimeline.tsx` — 顶部未来 7 天面试区
- Create: `src/components/GroupingTabs.tsx` — 分组切换按钮组
- Create: `src/components/CompanyBoard.tsx` — 中部看板列容器
- Create: `src/components/CompanyCard.tsx` — 公司卡及其展开编辑区
- Create: `src/components/ArchiveSection.tsx` — 底部归档区
- Test: `src/App.test.tsx` — 根页面渲染与分组切换
- Test: `src/lib/selectors.test.ts` — 派生逻辑测试
- Test: `src/lib/mutations.test.ts` — 纯函数更新逻辑测试
- Test: `src/lib/storage.test.ts` — 持久化读写测试
- Test: `e2e/workbench.spec.ts` — 关键用户流端到端测试

### Task 1: 初始化工程与测试基线

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.setup.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Test: `src/App.test.tsx`

- [ ] **Step 1: 写基础测试与工具链配置**

```json
// package.json
{
  "name": "oh_my_todo",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "jsdom": "^26.0.0",
    "playwright": "^1.50.0",
    "typescript": "^5.0.0",
    "vite": "^7.0.0",
    "vitest": "^3.0.0"
  }
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src", "vite.config.ts", "vitest.setup.ts", "playwright.config.ts"]
}
```

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts"
  }
});
```

```ts
// vitest.setup.ts
import "@testing-library/jest-dom/vitest";
```

```tsx
// src/App.test.tsx
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the interview workbench shell", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "面试工作台" })).toBeInTheDocument();
    expect(screen.getByText("原型初始化完成。")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行测试，确认当前失败**

Run:

```bash
pnpm install
pnpm vitest run src/App.test.tsx
```

Expected:

```text
FAIL  src/App.test.tsx
Error: Failed to resolve import "./App"
```

- [ ] **Step 3: 写最小可运行实现**

```gitignore
# .gitignore
node_modules
dist
playwright-report
test-results
.DS_Store
```

```html
<!-- index.html -->
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>面试工作台</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

```tsx
// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

```tsx
// src/App.tsx
export default function App() {
  return (
    <main style={{ padding: "48px", fontFamily: "sans-serif" }}>
      <h1>面试工作台</h1>
      <p>原型初始化完成。</p>
    </main>
  );
}
```

- [ ] **Step 4: 重新运行测试，确认通过**

Run:

```bash
pnpm vitest run src/App.test.tsx
```

Expected:

```text
✓ src/App.test.tsx (1 test)
```

- [ ] **Step 5: 提交当前基线**

```bash
git add .gitignore package.json tsconfig.json vite.config.ts vitest.setup.ts index.html src/main.tsx src/App.tsx src/App.test.tsx
git commit -m "chore: bootstrap interview workbench prototype"
```

### Task 2: 建立领域模型、示例数据和派生逻辑

**Files:**
- Create: `src/types/interview.ts`
- Create: `src/lib/sampleData.ts`
- Create: `src/lib/selectors.ts`
- Test: `src/lib/selectors.test.ts`

- [ ] **Step 1: 先写派生逻辑的失败测试**

```ts
// src/lib/selectors.test.ts
import { describe, expect, it } from "vitest";
import { sampleCompanies } from "./sampleData";
import {
  getActiveCompanies,
  getArchivedCompanies,
  getGroupedCompanies,
  getUpcomingInterviews
} from "./selectors";

const NOW = new Date("2026-04-17T09:00:00-07:00");

describe("selectors", () => {
  it("returns only scheduled interviews within the next 7 days in ascending order", () => {
    const upcoming = getUpcomingInterviews(sampleCompanies, NOW);

    expect(upcoming.map((item) => `${item.companyName}-${item.roundName}`)).toEqual([
      "ACME-一面",
      "字节跳动-HR 面"
    ]);
  });

  it("groups active companies by company type", () => {
    const groups = getGroupedCompanies(sampleCompanies, "companyType");

    expect(groups.map((group) => group.label)).toEqual(["创业公司", "大厂"]);
    expect(groups[0].companies.map((company) => company.name)).toEqual(["ACME", "Nova AI"]);
    expect(groups[1].companies.map((company) => company.name)).toEqual(["字节跳动"]);
  });

  it("keeps fully archived companies out of the active board", () => {
    expect(getActiveCompanies(sampleCompanies).map((company) => company.name)).toEqual([
      "ACME",
      "Nova AI",
      "字节跳动"
    ]);

    expect(getArchivedCompanies(sampleCompanies).map((company) => company.name)).toEqual([
      "Google"
    ]);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run:

```bash
pnpm vitest run src/lib/selectors.test.ts
```

Expected:

```text
FAIL  src/lib/selectors.test.ts
Error: Failed to resolve import "./sampleData"
```

- [ ] **Step 3: 实现类型、样例数据和 selectors**

```ts
// src/types/interview.ts
export type GroupingMode = "companyType" | "stage" | "priority";
export type CompanyType = "startup" | "big-tech";
export type Priority = "high" | "medium" | "low";
export type Stage = "screening" | "interviewing" | "offer" | "closed";
export type RoundStatus = "pending" | "scheduled" | "completed" | "waiting-result" | "closed";
export type ProcessStatus = "active" | "archived";

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
  highlights: string;
  risks: string;
  priority: Priority;
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
```

```ts
// src/lib/sampleData.ts
import type { CompanyRecord } from "../types/interview";

export const sampleCompanies: CompanyRecord[] = [
  {
    id: "acme",
    name: "ACME",
    companyType: "startup",
    overallImpression: "团队强，方向贴合，但节奏偏快。",
    highlights: "业务和过往经历贴近",
    risks: "组织稳定性需要继续确认",
    priority: "high",
    processes: [
      {
        id: "acme-pm",
        roleName: "Senior PM",
        stage: "interviewing",
        nextStep: "一面",
        status: "active",
        rounds: [
          {
            id: "acme-round-1",
            name: "一面",
            scheduledAt: "2026-04-17T14:00:00-07:00",
            status: "scheduled",
            notes: "关注 owner 意识"
          },
          {
            id: "acme-round-0",
            name: "简历沟通",
            scheduledAt: "2026-04-15T10:00:00-07:00",
            status: "completed",
            notes: "招聘经理反馈积极"
          }
        ]
      }
    ]
  },
  {
    id: "nova",
    name: "Nova AI",
    companyType: "startup",
    overallImpression: "赛道感兴趣，但需要继续判断现金流情况。",
    highlights: "产品方向喜欢",
    risks: "团队规模较小",
    priority: "medium",
    processes: [
      {
        id: "nova-product",
        roleName: "Product Lead",
        stage: "screening",
        nextStep: "待约面",
        status: "active",
        rounds: [
          {
            id: "nova-round-1",
            name: "初筛沟通",
            scheduledAt: null,
            status: "pending",
            notes: "等待 recruiter 确认时间"
          }
        ]
      }
    ]
  },
  {
    id: "bytedance",
    name: "字节跳动",
    companyType: "big-tech",
    overallImpression: "流程规范，但岗位细节还不够清晰。",
    highlights: "平台大，流程明确",
    risks: "岗位真实职责待确认",
    priority: "high",
    processes: [
      {
        id: "byte-growth",
        roleName: "Growth PM",
        stage: "interviewing",
        nextStep: "HR 面",
        status: "active",
        rounds: [
          {
            id: "byte-round-1",
            name: "HR 面",
            scheduledAt: "2026-04-18T10:30:00-07:00",
            status: "scheduled",
            notes: "需要确认汇报关系"
          }
        ]
      }
    ]
  },
  {
    id: "google",
    name: "Google",
    companyType: "big-tech",
    overallImpression: "品牌吸引力强，但业务匹配度一般。",
    highlights: "平台资源足",
    risks: "项目方向一般",
    priority: "low",
    processes: [
      {
        id: "google-ads",
        roleName: "PM",
        stage: "closed",
        nextStep: "流程结束",
        status: "archived",
        rounds: [
          {
            id: "google-round-1",
            name: "终面",
            scheduledAt: "2026-04-05T09:00:00-07:00",
            status: "closed",
            notes: "流程已结束"
          }
        ]
      }
    ]
  }
];
```

```ts
// src/lib/selectors.ts
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
          if (!round.scheduledAt || round.status !== "scheduled") {
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

  return Array.from(buckets.entries()).map(([key, groupedCompanies]) => ({
    key,
    label: GROUP_LABELS[grouping][key],
    companies: groupedCompanies
  }));
}
```

- [ ] **Step 4: 重新运行测试，确认派生逻辑通过**

Run:

```bash
pnpm vitest run src/lib/selectors.test.ts
```

Expected:

```text
✓ src/lib/selectors.test.ts (3 tests)
```

- [ ] **Step 5: 提交领域层**

```bash
git add src/types/interview.ts src/lib/sampleData.ts src/lib/selectors.ts src/lib/selectors.test.ts
git commit -m "feat: add interview domain selectors"
```

### Task 3: 搭建只读版工作台布局

**Files:**
- Create: `src/styles/app.css`
- Create: `src/components/UpcomingTimeline.tsx`
- Create: `src/components/GroupingTabs.tsx`
- Create: `src/components/CompanyBoard.tsx`
- Create: `src/components/ArchiveSection.tsx`
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx`

- [ ] **Step 1: 先写工作台渲染与分组切换的失败测试**

```tsx
// src/App.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("App", () => {
  it("renders the upcoming timeline and the default company-type groups", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "未来 7 天面试" })).toBeInTheDocument();
    expect(screen.getByText("创业公司")).toBeInTheDocument();
    expect(screen.getByText("大厂")).toBeInTheDocument();
    expect(screen.getByText("ACME")).toBeInTheDocument();
    expect(screen.getByText("字节跳动")).toBeInTheDocument();
  });

  it("switches grouping tabs without reloading the page", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "按个人优先级分组" }));

    expect(screen.getByText("高优先级")).toBeInTheDocument();
    expect(screen.getByText("中优先级")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run:

```bash
pnpm vitest run src/App.test.tsx
```

Expected:

```text
FAIL  src/App.test.tsx
TestingLibraryElementError: Unable to find role "heading" with name "未来 7 天面试"
```

- [ ] **Step 3: 实现只读版页面骨架**

```css
/* src/styles/app.css */
:root {
  font-family: "SF Pro Display", "PingFang SC", sans-serif;
  color: #1f1a15;
  background: linear-gradient(180deg, #f6f1e7 0%, #efe6d8 100%);
}

body {
  margin: 0;
}

.page {
  min-height: 100vh;
  padding: 40px;
}

.panel {
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(98, 77, 44, 0.12);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 18px 40px rgba(66, 47, 22, 0.08);
}

.timeline-list,
.board-grid {
  display: grid;
  gap: 16px;
}

.board-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.group-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.group-tabs button[aria-pressed="true"] {
  background: #1f1a15;
  color: white;
}

.company-card,
.timeline-item {
  background: white;
  border: 1px solid rgba(98, 77, 44, 0.12);
  border-radius: 16px;
  padding: 16px;
}
```

```tsx
// src/components/UpcomingTimeline.tsx
import type { UpcomingInterview } from "../types/interview";

export function UpcomingTimeline({ interviews }: { interviews: UpcomingInterview[] }) {
  return (
    <section className="panel" aria-labelledby="upcoming-title">
      <h2 id="upcoming-title">未来 7 天面试</h2>
      <div className="timeline-list">
        {interviews.map((interview) => (
          <article className="timeline-item" key={interview.roundId}>
            <strong>{interview.companyName}</strong>
            <div>{interview.roundName}</div>
            <div>{new Date(interview.scheduledAt).toLocaleString("zh-CN")}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
```

```tsx
// src/components/GroupingTabs.tsx
import type { GroupingMode } from "../types/interview";

const OPTIONS: Array<{ value: GroupingMode; label: string; ariaLabel: string }> = [
  { value: "companyType", label: "公司类型", ariaLabel: "按公司类型分组" },
  { value: "stage", label: "流程阶段", ariaLabel: "按流程阶段分组" },
  { value: "priority", label: "个人优先级", ariaLabel: "按个人优先级分组" }
];

export function GroupingTabs({
  value,
  onChange
}: {
  value: GroupingMode;
  onChange: (value: GroupingMode) => void;
}) {
  return (
    <div className="group-tabs" role="tablist" aria-label="分组切换">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          aria-label={option.ariaLabel}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
```

```tsx
// src/components/CompanyBoard.tsx
import type { CompanyGroup } from "../types/interview";

export function CompanyBoard({ groups }: { groups: CompanyGroup[] }) {
  return (
    <section className="board-grid">
      {groups.map((group) => (
        <div className="panel" key={group.key}>
          <h3>{group.label}</h3>
          {group.companies.map((company) => (
            <article className="company-card" key={company.id}>
              <strong>{company.name}</strong>
              <div>{company.processes.find((process) => process.status === "active")?.nextStep}</div>
              <div>{company.highlights}</div>
            </article>
          ))}
        </div>
      ))}
    </section>
  );
}
```

```tsx
// src/components/ArchiveSection.tsx
import type { CompanyRecord } from "../types/interview";

export function ArchiveSection({ companies }: { companies: CompanyRecord[] }) {
  return (
    <details className="panel">
      <summary>归档流程（{companies.length}）</summary>
      {companies.map((company) => (
        <article className="company-card" key={company.id}>
          <strong>{company.name}</strong>
          <div>{company.overallImpression}</div>
        </article>
      ))}
    </details>
  );
}
```

```tsx
// src/App.tsx
import { useState } from "react";
import "./styles/app.css";
import { ArchiveSection } from "./components/ArchiveSection";
import { CompanyBoard } from "./components/CompanyBoard";
import { GroupingTabs } from "./components/GroupingTabs";
import { UpcomingTimeline } from "./components/UpcomingTimeline";
import { sampleCompanies } from "./lib/sampleData";
import { getArchivedCompanies, getGroupedCompanies, getUpcomingInterviews } from "./lib/selectors";
import type { GroupingMode } from "./types/interview";

export default function App() {
  const [grouping, setGrouping] = useState<GroupingMode>("companyType");

  return (
    <main className="page">
      <header>
        <h1>面试工作台</h1>
        <p>先看最近已定面试，再管理仍在推进的公司流程。</p>
      </header>

      <UpcomingTimeline
        interviews={getUpcomingInterviews(sampleCompanies, new Date("2026-04-17T09:00:00-07:00"))}
      />

      <section style={{ marginTop: 24 }}>
        <GroupingTabs value={grouping} onChange={setGrouping} />
        <CompanyBoard groups={getGroupedCompanies(sampleCompanies, grouping)} />
      </section>

      <section style={{ marginTop: 24 }}>
        <ArchiveSection companies={getArchivedCompanies(sampleCompanies)} />
      </section>
    </main>
  );
}
```

- [ ] **Step 4: 重新运行测试，确认布局通过**

Run:

```bash
pnpm vitest run src/App.test.tsx
```

Expected:

```text
✓ src/App.test.tsx (2 tests)
```

- [ ] **Step 5: 提交只读布局**

```bash
git add src/styles/app.css src/components/UpcomingTimeline.tsx src/components/GroupingTabs.tsx src/components/CompanyBoard.tsx src/components/ArchiveSection.tsx src/App.tsx src/App.test.tsx
git commit -m "feat: render read-only interview workbench"
```

### Task 4: 加入公司卡展开、内联编辑和流程变更

**Files:**
- Create: `src/lib/mutations.ts`
- Create: `src/hooks/useInterviewWorkbench.ts`
- Create: `src/components/CompanyCard.tsx`
- Modify: `src/components/CompanyBoard.tsx`
- Modify: `src/App.tsx`
- Test: `src/lib/mutations.test.ts`

- [ ] **Step 1: 先写状态更新逻辑的失败测试**

```ts
// src/lib/mutations.test.ts
import { describe, expect, it } from "vitest";
import { sampleCompanies } from "./sampleData";
import {
  addRoundToProcess,
  archiveProcessById,
  updateCompanySummary,
  updateRoundRecord
} from "./mutations";

describe("mutations", () => {
  it("updates company-level summary fields immutably", () => {
    const next = updateCompanySummary(sampleCompanies, "acme", {
      overallImpression: "团队很强，但需要确认组织稳定性。"
    });

    expect(next.find((company) => company.id === "acme")?.overallImpression).toBe(
      "团队很强，但需要确认组织稳定性。"
    );
    expect(sampleCompanies.find((company) => company.id === "acme")?.overallImpression).not.toBe(
      "团队很强，但需要确认组织稳定性。"
    );
  });

  it("adds a new round to the selected process", () => {
    const next = addRoundToProcess(sampleCompanies, "acme", "acme-pm");

    expect(next.find((company) => company.id === "acme")?.processes[0].rounds).toHaveLength(3);
  });

  it("archives only the targeted process", () => {
    const next = archiveProcessById(sampleCompanies, "acme", "acme-pm");

    expect(next.find((company) => company.id === "acme")?.processes[0].status).toBe("archived");
  });

  it("updates round notes and schedule", () => {
    const next = updateRoundRecord(sampleCompanies, "bytedance", "byte-growth", "byte-round-1", {
      scheduledAt: "2026-04-18T12:00",
      notes: "确认汇报对象"
    });

    const round = next
      .find((company) => company.id === "bytedance")
      ?.processes[0].rounds.find((item) => item.id === "byte-round-1");

    expect(round?.scheduledAt).toBe("2026-04-18T12:00");
    expect(round?.notes).toBe("确认汇报对象");
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run:

```bash
pnpm vitest run src/lib/mutations.test.ts
```

Expected:

```text
FAIL  src/lib/mutations.test.ts
Error: Failed to resolve import "./mutations"
```

- [ ] **Step 3: 实现变更函数、工作台 hook 和公司卡**

```ts
// src/lib/mutations.ts
import type { CompanyRecord, RoundRecord } from "../types/interview";

export function updateCompanySummary(
  companies: CompanyRecord[],
  companyId: string,
  patch: Partial<Pick<CompanyRecord, "overallImpression" | "highlights" | "risks" | "priority">>
) {
  return companies.map((company) =>
    company.id === companyId ? { ...company, ...patch } : company
  );
}

export function addRoundToProcess(
  companies: CompanyRecord[],
  companyId: string,
  processId: string
) {
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
                  name: `新增轮次 ${process.rounds.length + 1}`,
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

export function archiveProcessById(
  companies: CompanyRecord[],
  companyId: string,
  processId: string
) {
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

export function updateRoundRecord(
  companies: CompanyRecord[],
  companyId: string,
  processId: string,
  roundId: string,
  patch: Partial<RoundRecord>
) {
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
```

```ts
// src/hooks/useInterviewWorkbench.ts
import { useMemo, useState } from "react";
import { sampleCompanies } from "../lib/sampleData";
import {
  addRoundToProcess,
  archiveProcessById,
  updateCompanySummary,
  updateRoundRecord
} from "../lib/mutations";
import { getArchivedCompanies, getGroupedCompanies, getUpcomingInterviews } from "../lib/selectors";
import type { CompanyRecord, GroupingMode, RoundRecord } from "../types/interview";

const NOW = new Date("2026-04-17T09:00:00-07:00");
type CompanySummaryPatch = Partial<
  Pick<CompanyRecord, "overallImpression" | "highlights" | "risks" | "priority">
>;

export function useInterviewWorkbench(initialCompanies: CompanyRecord[] = sampleCompanies) {
  const [grouping, setGrouping] = useState<GroupingMode>("companyType");
  const [companies, setCompanies] = useState<CompanyRecord[]>(initialCompanies);

  return {
    grouping,
    setGrouping,
    companies,
    groupedCompanies: useMemo(() => getGroupedCompanies(companies, grouping), [companies, grouping]),
    archivedCompanies: useMemo(() => getArchivedCompanies(companies), [companies]),
    upcomingInterviews: useMemo(() => getUpcomingInterviews(companies, NOW), [companies]),
    updateCompanySummary: (companyId: string, patch: CompanySummaryPatch) =>
      setCompanies((current) => updateCompanySummary(current, companyId, patch)),
    addRoundToProcess: (companyId: string, processId: string) =>
      setCompanies((current) => addRoundToProcess(current, companyId, processId)),
    archiveProcessById: (companyId: string, processId: string) =>
      setCompanies((current) => archiveProcessById(current, companyId, processId)),
    updateRoundRecord: (
      companyId: string,
      processId: string,
      roundId: string,
      patch: Partial<RoundRecord>
    ) => setCompanies((current) => updateRoundRecord(current, companyId, processId, roundId, patch))
  };
}
```

```tsx
// src/components/CompanyCard.tsx
import { useState } from "react";
import type { CompanyRecord, InterviewProcess, RoundRecord } from "../types/interview";

type CompanySummaryPatch = Partial<
  Pick<CompanyRecord, "overallImpression" | "highlights" | "risks" | "priority">
>;

interface CompanyCardProps {
  company: CompanyRecord;
  onSaveSummary: (companyId: string, patch: CompanySummaryPatch) => void;
  onAddRound: (companyId: string, processId: string) => void;
  onArchiveProcess: (companyId: string, processId: string) => void;
  onUpdateRound: (
    companyId: string,
    processId: string,
    roundId: string,
    patch: Partial<RoundRecord>
  ) => void;
}

function ActiveProcess({ process, company, onAddRound, onArchiveProcess, onUpdateRound }: {
  process: InterviewProcess;
  company: CompanyRecord;
  onAddRound: CompanyCardProps["onAddRound"];
  onArchiveProcess: CompanyCardProps["onArchiveProcess"];
  onUpdateRound: CompanyCardProps["onUpdateRound"];
}) {
  return (
    <section style={{ marginTop: 16 }}>
      <h4>{process.roleName}</h4>
      <button type="button" onClick={() => onAddRound(company.id, process.id)}>
        新增轮次
      </button>
      <button type="button" onClick={() => onArchiveProcess(company.id, process.id)}>
        归档流程
      </button>

      {process.rounds.map((round) => (
        <div key={round.id} style={{ marginTop: 12 }}>
          <strong>{round.name}</strong>
          <input
            aria-label={`${company.name}-${round.name}-时间`}
            type="datetime-local"
            value={round.scheduledAt ?? ""}
            onChange={(event) =>
              onUpdateRound(company.id, process.id, round.id, { scheduledAt: event.target.value })
            }
          />
          <textarea
            aria-label={`${company.name}-${round.name}-备注`}
            value={round.notes}
            onChange={(event) =>
              onUpdateRound(company.id, process.id, round.id, { notes: event.target.value })
            }
          />
        </div>
      ))}
    </section>
  );
}

export function CompanyCard(props: CompanyCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [impressionDraft, setImpressionDraft] = useState(props.company.overallImpression);

  return (
    <article className="company-card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <strong>{props.company.name}</strong>
          <div>{props.company.highlights}</div>
          <div>{props.company.risks}</div>
        </div>

        <button
          type="button"
          aria-label={`${expanded ? "收起" : "展开"} ${props.company.name}`}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "收起" : "展开"}
        </button>
      </div>

      {expanded ? (
        <div style={{ marginTop: 16 }}>
          <label>
            公司整体印象
            <textarea
              aria-label="公司整体印象"
              value={impressionDraft}
              onChange={(event) => setImpressionDraft(event.target.value)}
            />
          </label>

          <button
            type="button"
            onClick={() =>
              props.onSaveSummary(props.company.id, {
                overallImpression: impressionDraft
              })
            }
          >
            保存公司判断
          </button>

          {props.company.processes
            .filter((process) => process.status === "active")
            .map((process) => (
              <ActiveProcess
                key={process.id}
                process={process}
                company={props.company}
                onAddRound={props.onAddRound}
                onArchiveProcess={props.onArchiveProcess}
                onUpdateRound={props.onUpdateRound}
              />
            ))}
        </div>
      ) : null}
    </article>
  );
}
```

```tsx
// src/components/CompanyBoard.tsx
import type { CompanyGroup, CompanyRecord, RoundRecord } from "../types/interview";
import { CompanyCard } from "./CompanyCard";

type CompanySummaryPatch = Partial<
  Pick<CompanyRecord, "overallImpression" | "highlights" | "risks" | "priority">
>;

interface CompanyBoardProps {
  groups: CompanyGroup[];
  onSaveSummary: (companyId: string, patch: CompanySummaryPatch) => void;
  onAddRound: (companyId: string, processId: string) => void;
  onArchiveProcess: (companyId: string, processId: string) => void;
  onUpdateRound: (
    companyId: string,
    processId: string,
    roundId: string,
    patch: Partial<RoundRecord>
  ) => void;
}

export function CompanyBoard({
  groups,
  onSaveSummary,
  onAddRound,
  onArchiveProcess,
  onUpdateRound
}: CompanyBoardProps) {
  return (
    <section className="board-grid">
      {groups.map((group) => (
        <div className="panel" key={group.key}>
          <h3>{group.label}</h3>
          {group.companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onSaveSummary={onSaveSummary}
              onAddRound={onAddRound}
              onArchiveProcess={onArchiveProcess}
              onUpdateRound={onUpdateRound}
            />
          ))}
        </div>
      ))}
    </section>
  );
}
```

```tsx
// src/App.tsx
import "./styles/app.css";
import { ArchiveSection } from "./components/ArchiveSection";
import { CompanyBoard } from "./components/CompanyBoard";
import { GroupingTabs } from "./components/GroupingTabs";
import { UpcomingTimeline } from "./components/UpcomingTimeline";
import { useInterviewWorkbench } from "./hooks/useInterviewWorkbench";

export default function App() {
  const workbench = useInterviewWorkbench();

  return (
    <main className="page">
      <header>
        <h1>面试工作台</h1>
        <p>先看最近已定面试，再管理仍在推进的公司流程。</p>
      </header>

      <UpcomingTimeline interviews={workbench.upcomingInterviews} />

      <section style={{ marginTop: 24 }}>
        <GroupingTabs value={workbench.grouping} onChange={workbench.setGrouping} />
        <CompanyBoard
          groups={workbench.groupedCompanies}
          onSaveSummary={workbench.updateCompanySummary}
          onAddRound={workbench.addRoundToProcess}
          onArchiveProcess={workbench.archiveProcessById}
          onUpdateRound={workbench.updateRoundRecord}
        />
      </section>

      <section style={{ marginTop: 24 }}>
        <ArchiveSection companies={workbench.archivedCompanies} />
      </section>
    </main>
  );
}
```

- [ ] **Step 4: 重新运行测试，确认内联编辑核心逻辑通过**

Run:

```bash
pnpm vitest run src/lib/mutations.test.ts src/App.test.tsx
```

Expected:

```text
✓ src/lib/mutations.test.ts (4 tests)
✓ src/App.test.tsx (2 tests)
```

- [ ] **Step 5: 提交交互能力**

```bash
git add src/lib/mutations.ts src/lib/mutations.test.ts src/hooks/useInterviewWorkbench.ts src/components/CompanyCard.tsx src/components/CompanyBoard.tsx src/App.tsx
git commit -m "feat: add inline company and round editing"
```

### Task 5: 接入本地持久化并让视图自动重算

**Files:**
- Create: `src/lib/storage.ts`
- Modify: `src/hooks/useInterviewWorkbench.ts`
- Test: `src/lib/storage.test.ts`

- [ ] **Step 1: 先写持久化失败测试**

```ts
// src/lib/storage.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import { sampleCompanies } from "./sampleData";
import { loadWorkbenchSnapshot, saveWorkbenchSnapshot } from "./storage";

describe("storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves and loads the workbench snapshot", () => {
    saveWorkbenchSnapshot({
      grouping: "priority",
      companies: sampleCompanies
    });

    const snapshot = loadWorkbenchSnapshot();

    expect(snapshot?.grouping).toBe("priority");
    expect(snapshot?.companies[0].name).toBe("ACME");
  });

  it("returns null when there is no saved snapshot", () => {
    expect(loadWorkbenchSnapshot()).toBeNull();
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run:

```bash
pnpm vitest run src/lib/storage.test.ts
```

Expected:

```text
FAIL  src/lib/storage.test.ts
Error: Failed to resolve import "./storage"
```

- [ ] **Step 3: 实现 storage 并接入 hook**

```ts
// src/lib/storage.ts
import type { CompanyRecord, GroupingMode } from "../types/interview";

const STORAGE_KEY = "interview-workbench:v1";

export interface WorkbenchSnapshot {
  grouping: GroupingMode;
  companies: CompanyRecord[];
}

export function loadWorkbenchSnapshot(): WorkbenchSnapshot | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  return JSON.parse(raw) as WorkbenchSnapshot;
}

export function saveWorkbenchSnapshot(snapshot: WorkbenchSnapshot) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}
```

```ts
// src/hooks/useInterviewWorkbench.ts
import { useEffect, useMemo, useState } from "react";
import { sampleCompanies } from "../lib/sampleData";
import {
  addRoundToProcess,
  archiveProcessById,
  updateCompanySummary,
  updateRoundRecord
} from "../lib/mutations";
import { getArchivedCompanies, getGroupedCompanies, getUpcomingInterviews } from "../lib/selectors";
import { loadWorkbenchSnapshot, saveWorkbenchSnapshot } from "../lib/storage";
import type { CompanyRecord, GroupingMode, RoundRecord } from "../types/interview";

const NOW = new Date("2026-04-17T09:00:00-07:00");
type CompanySummaryPatch = Partial<
  Pick<CompanyRecord, "overallImpression" | "highlights" | "risks" | "priority">
>;

export function useInterviewWorkbench(initialCompanies: CompanyRecord[] = sampleCompanies) {
  const snapshot = loadWorkbenchSnapshot();
  const [grouping, setGrouping] = useState<GroupingMode>(snapshot?.grouping ?? "companyType");
  const [companies, setCompanies] = useState<CompanyRecord[]>(snapshot?.companies ?? initialCompanies);

  useEffect(() => {
    saveWorkbenchSnapshot({ grouping, companies });
  }, [grouping, companies]);

  return {
    grouping,
    setGrouping,
    companies,
    groupedCompanies: useMemo(() => getGroupedCompanies(companies, grouping), [companies, grouping]),
    archivedCompanies: useMemo(() => getArchivedCompanies(companies), [companies]),
    upcomingInterviews: useMemo(() => getUpcomingInterviews(companies, NOW), [companies]),
    updateCompanySummary: (companyId: string, patch: CompanySummaryPatch) =>
      setCompanies((current) => updateCompanySummary(current, companyId, patch)),
    addRoundToProcess: (companyId: string, processId: string) =>
      setCompanies((current) => addRoundToProcess(current, companyId, processId)),
    archiveProcessById: (companyId: string, processId: string) =>
      setCompanies((current) => archiveProcessById(current, companyId, processId)),
    updateRoundRecord: (
      companyId: string,
      processId: string,
      roundId: string,
      patch: Partial<RoundRecord>
    ) => setCompanies((current) => updateRoundRecord(current, companyId, processId, roundId, patch))
  };
}
```

- [ ] **Step 4: 重新运行测试，确认持久化通过**

Run:

```bash
pnpm vitest run src/lib/storage.test.ts src/lib/mutations.test.ts src/lib/selectors.test.ts src/App.test.tsx
```

Expected:

```text
✓ src/lib/storage.test.ts (2 tests)
✓ src/lib/mutations.test.ts (4 tests)
✓ src/lib/selectors.test.ts (3 tests)
✓ src/App.test.tsx (2 tests)
```

- [ ] **Step 5: 提交持久化**

```bash
git add src/lib/storage.ts src/lib/storage.test.ts src/hooks/useInterviewWorkbench.ts
git commit -m "feat: persist workbench state locally"
```

### Task 6: 加入端到端验证与项目说明

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/workbench.spec.ts`
- Create: `README.md`

- [ ] **Step 1: 先写关键用户流的失败测试**

```ts
// e2e/workbench.spec.ts
import { expect, test } from "@playwright/test";

test("user can switch grouping, edit a company note, and keep the change after reload", async ({
  page
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "未来 7 天面试" })).toBeVisible();

  await page.getByRole("button", { name: "按个人优先级分组" }).click();
  await expect(page.getByText("高优先级")).toBeVisible();

  await page.getByRole("button", { name: "展开 ACME" }).click();
  await page.getByLabel("公司整体印象").fill("团队很强，但需要继续确认稳定性。");
  await page.getByRole("button", { name: "保存公司判断" }).click();

  await page.reload();
  await page.getByRole("button", { name: "展开 ACME" }).click();
  await expect(page.getByLabel("公司整体印象")).toHaveValue(
    "团队很强，但需要继续确认稳定性。"
  );
});
```

- [ ] **Step 2: 运行 e2e，确认当前失败**

Run:

```bash
pnpm exec playwright install
pnpm e2e
```

Expected:

```text
Error: No tests found or failed to launch web server
```

- [ ] **Step 3: 配置 Playwright 与 README**

```ts
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true
  },
  webServer: {
    command: "pnpm dev --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true
  }
});
```

````md
<!-- README.md -->
# 面试工作台原型

## 目标

验证一个桌面 Web 面试管理工作台是否能同时承载：

- 未来 7 天已定面试
- 按分组查看的活跃公司流程
- 公司级和轮次级感受记录

## 本地运行

```bash
pnpm install
pnpm dev
```

## 测试

```bash
pnpm test
pnpm e2e
```

## 当前范围

- 桌面 Web
- 纯手动录入
- localStorage 持久化
- 不含自动导入和多端同步
````

- [ ] **Step 4: 运行完整验证**

Run:

```bash
pnpm test
pnpm e2e
```

Expected:

```text
✓ all vitest suites passed
✓ e2e/workbench.spec.ts passed
```

- [ ] **Step 5: 提交验证与说明**

```bash
git add playwright.config.ts e2e/workbench.spec.ts README.md
git commit -m "test: cover interview workbench user flow"
```

## 自检结论

- 顶部未来 7 天面试区：由 Task 2 的 `getUpcomingInterviews` 和 Task 3 的 `UpcomingTimeline` 覆盖。
- 可切换分组工作台：由 Task 2 的 `getGroupedCompanies` 和 Task 3 的 `GroupingTabs` / `CompanyBoard` 覆盖。
- 公司级与轮次级编辑：由 Task 4 的 `CompanyCard`、`mutations.ts`、`useInterviewWorkbench.ts` 覆盖。
- 底部归档区：由 Task 2 的 `getArchivedCompanies` 和 Task 3 / Task 4 的归档展示与流程归档操作覆盖。
- 纯手动录入 + 本地保存：由 Task 4 的内联编辑和 Task 5 的 `localStorage` 持久化覆盖。
- 测试与可执行验证：由 Task 1 到 Task 6 的单测、集成测试和 e2e 覆盖。

本计划没有遗漏 PRD 中的核心范围；未纳入的自动导入、多端同步、提醒系统依然明确保持在非目标范围内。
