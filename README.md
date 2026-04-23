<p align="center">
  <img src="./public/readme/banner-desk-almanac.svg" alt="oh_my_todo desk almanac banner" width="100%" />
</p>

<h1 align="center">oh_my_todo</h1>

<p align="center">
  <strong>A private interview desk for agenda, judgment, negotiation, and comparison.</strong>
</p>

<p align="center">
  <a href="./README.zh-CN.md">中文版本</a>
</p>

<p align="center">
  <img alt="Local first" src="https://img.shields.io/badge/local--first-yes-3E4E45?style=flat-square&labelColor=F2EADF" />
  <img alt="No login" src="https://img.shields.io/badge/login-not%20required-8A6A4A?style=flat-square&labelColor=F2EADF" />
  <img alt="Portable data" src="https://img.shields.io/badge/data-portable-5F6B5C?style=flat-square&labelColor=F2EADF" />
</p>

<p align="center">
  Keep the next seven days, active company dossiers, negotiation snapshots, and offer comparison on one quiet local-first workbench.
</p>

<p align="center">
  <img src="./public/readme/workbench-desk-almanac.png" alt="Redesigned interview workbench" width="920" />
</p>

## Why this desk exists

Interview work is rarely just a checklist. The real question is usually whether a company is worth another round, another note, or another negotiation pass.

`oh_my_todo` keeps the schedule, the company judgment, the compensation trail, and the final comparison in one place so the next move stays visible.

## What stays on the desk

- A next-7-days agenda for interviews that are already scheduled.
- Active company dossiers with summary notes, round history, and negotiation context.
- An offer comparison sheet for active negotiations or the latest saved package per company.
- An archive area for companies whose work has been fully archived.
- JSON export and import for backup or moving between browsers.

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

## How to use it

1. Create a company and its first process.
2. Keep the company summary, interview rounds, and negotiation snapshots on the same dossier.
3. Switch the board between company type and stage views.
4. Review the comparison sheet when you need to weigh active negotiations or each company's latest saved package.
5. Export JSON whenever you want a backup, then import the same shape to restore the desk later.

## Privacy and storage

- Data is stored in the current browser with `localStorage`.
- Refreshing the page keeps the current workbench intact.
- Clearing browser data removes the local copy.
- Another browser or device does not sync automatically.
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
