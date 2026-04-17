import type { CompanyRecord, GroupingMode } from "../types/interview";

const STORAGE_KEY = "interview-workbench:v1";

export interface WorkbenchSnapshot {
  grouping: GroupingMode;
  companies: CompanyRecord[];
}

export function loadWorkbenchSnapshot(): WorkbenchSnapshot | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as WorkbenchSnapshot;
}

export function saveWorkbenchSnapshot(snapshot: WorkbenchSnapshot) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}
