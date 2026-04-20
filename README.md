<p align="center">
  <img src="./public/readme/banner-paper-terminal.svg" alt="oh_my_todo paper and terminal banner" width="100%" />
</p>

<h1 align="center">oh_my_todo</h1>

<p align="center">
  <strong>An interview workbench for people who need judgment, not just checkboxes.</strong>
</p>

<p align="center">
  <a href="./README.zh-CN.md">中文版本</a>
</p>

<p align="center">
  <img alt="Local first" src="https://img.shields.io/badge/local--first-yes-162038?style=flat-square" />
  <img alt="No login" src="https://img.shields.io/badge/login-not%20required-E9B15F?style=flat-square&labelColor=162038" />
  <img alt="Export / Import" src="https://img.shields.io/badge/data-portable-4D6A8C?style=flat-square&labelColor=162038" />
  <img alt="React 19" src="https://img.shields.io/badge/react-19-7EB6C6?style=flat-square&labelColor=162038" />
  <img alt="Vite 7" src="https://img.shields.io/badge/vite-7-F2E7D6?style=flat-square&labelColor=162038" />
</p>

<p align="center">
  A local-first board for interview schedules, company judgment, and round-by-round notes.
</p>

<p align="center">
  <img src="./public/readme/demo-paper-terminal.gif" alt="Concept animation for the interview workbench" width="920" />
</p>

```text
┌──────────────────────────────────────────────────────────────┐
│  oh_my_todo :: interview workbench                          │
│                                                              │
│  next 7 days      keep scheduled interviews visible          │
│  company board    group active processes in one place        │
│  judgment notes   write what you think, not just what is due │
│  portable data    export JSON and carry everything with you  │
│  privacy mode     local-first, no login, browser-only        │
└──────────────────────────────────────────────────────────────┘
```

## Why this exists

Typical todo apps are good at collecting tasks, but interviews are not just tasks.

When you are evaluating a company, you usually need to see three things together:

- what is already scheduled
- how round progress maps to the current screening/interviewing lens
- what you actually think about the company after each round

`oh_my_todo` is built around that reality. It is less about checking off chores and more about keeping timing, momentum, and judgment in the same workspace.

## Why it is different from other todo apps

| Typical todo app | `oh_my_todo` |
| --- | --- |
| Primary unit is a task | Primary unit is a company + interview process |
| Optimized for completion | Optimized for decision-making |
| Notes usually live somewhere else | Company judgment and round notes live beside the schedule |
| Often assumes cloud accounts | Works without login |
| Data is often trapped inside the app | JSON export / import is part of the workflow |
| Time is usually just a due date | Time is a real interview timeline |

## Highlights

- **Interview-first layout**: a future-7-days view and a grouped company board live in the same workspace.
- **Judgment in context**: each company keeps its overall impression next to the actual interview rounds that shaped that impression.
- **Local-first privacy**: no account, no backend requirement, no mandatory sync.
- **Portable by default**: export structured JSON, edit it locally if you want, then import it back.
- **Made for real momentum**: better for “Should I keep pushing this company?” than “Did I finish task #14?”

## What you can do

- Create companies and their first interview process without logging in.
- Track interview rounds, notes, and schedules in one place; the screening/interviewing lens is derived from round progress.
- Keep an overall company impression that grows with round-by-round notes.
- Group the board by company type or the derived screening/interviewing lens.
- Archive ended processes after you mark them archived.
- Export your full workspace as JSON.
- Import a previously exported JSON file to restore or move your data.

## Quick start

### Requirements

- Node.js `^20.19.0 || >=22.12.0`
- npm

### Install and run

```bash
git clone https://github.com/SevenTianyu/oh_my_todo.git
cd oh_my_todo
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

### One-line shell setup

```bash
git clone https://github.com/SevenTianyu/oh_my_todo.git && cd oh_my_todo && npm install && npm run dev
```

## One-line setup with Claude Code and Codex

If you prefer to let an agent set it up for you, these prompts are enough once you are in the repo:

### Claude Code

```text
Install the dependencies for this project and run the Vite development server locally.
```

### Codex

```text
Install dependencies in this repository and start the local Vite dev server.
```

If you want the agent to do the full clone-and-run flow, use:

### Claude Code full prompt

```text
Clone https://github.com/SevenTianyu/oh_my_todo.git, install dependencies, and run the Vite development server.
```

### Codex full prompt

```text
Clone https://github.com/SevenTianyu/oh_my_todo.git, install dependencies, and start the local Vite app.
```

## How to use it

1. Open the app and create your first company.
2. Add the company, type, and role; the app creates the first round for you.
3. Expand `Company Judgment` when you want to edit your overall view.
4. Expand `Interview Schedule` when you want to add or update rounds.
5. Export JSON whenever you want a backup or want to move data between browsers or devices.
6. Import the same JSON format to restore your board later.

## Privacy and storage

- Data is stored in the current browser via `localStorage`.
- Refreshing the page does not lose your workspace.
- Clearing browser data removes the local copy.
- Another browser or device will not sync automatically.
- Migration is done through JSON export and import.

## Development commands

```bash
npm run dev
npm run test
npm run build
```

For Playwright end-to-end tests:

```bash
npx playwright install
npm run e2e
```

## Tech stack

- React 19
- TypeScript
- Vite
- Vitest
- Playwright

## Project philosophy

`oh_my_todo` is intentionally opinionated:

- no login wall
- no backend dependency for first use
- no fake productivity theater
- no task spam for something that is really a decision process

It is a small tool for people who want a cleaner way to think through interviews.
