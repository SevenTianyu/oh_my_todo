import { beforeEach, describe, expect, it } from "vitest";
import { sampleCompanies } from "./sampleData";
import {
  createEmptyWorkbenchSnapshot,
  getWorkbenchExportFilename,
  loadWorkbenchSnapshot,
  parseWorkbenchSnapshotImport,
  saveWorkbenchSnapshot,
  serializeWorkbenchSnapshot
} from "./storage";

describe("storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves and loads the v2 workbench snapshot", () => {
    saveWorkbenchSnapshot({
      version: 2,
      grouping: "companyType",
      companies: sampleCompanies
    });

    const snapshot = loadWorkbenchSnapshot();

    expect(snapshot?.version).toBe(2);
    expect(snapshot?.grouping).toBe("companyType");
    expect(snapshot?.companies[0].name).toBe("ACME");
  });

  it("returns null when there is no saved snapshot", () => {
    expect(loadWorkbenchSnapshot()).toBeNull();
  });

  it("migrates legacy snapshots without a version field into v2", () => {
    window.localStorage.setItem(
      "interview-workbench:v1",
      JSON.stringify({
        grouping: "priority",
        companies: sampleCompanies
      })
    );

    const snapshot = loadWorkbenchSnapshot();

    expect(snapshot).toEqual({
      version: 2,
      grouping: "companyType",
      companies: sampleCompanies
    });
  });

  it("merges legacy highlights and risks into overall impression when loading old data", () => {
    window.localStorage.setItem(
      "interview-workbench:v1",
      JSON.stringify({
        grouping: "companyType",
        companies: [
          {
            id: "legacy-company",
            name: "Legacy Co",
            companyType: "startup",
            overallImpression: "基础判断",
            highlights: "亮点信息",
            risks: "风险信息",
            processes: []
          }
        ]
      })
    );

    const snapshot = loadWorkbenchSnapshot();

    expect(snapshot?.companies[0]).toEqual({
      id: "legacy-company",
      name: "Legacy Co",
      companyType: "startup",
      overallImpression: "基础判断\n亮点：亮点信息\n风险：风险信息",
      processes: []
    });
  });

  it("parses a valid imported snapshot", () => {
    const result = parseWorkbenchSnapshotImport(
      JSON.stringify({
        version: 2,
        grouping: "companyType",
        companies: sampleCompanies
      })
    );

    expect(result).toEqual({
      ok: true,
      snapshot: {
        version: 2,
        grouping: "companyType",
        companies: sampleCompanies
      }
    });
  });

  it("reports invalid json during import parsing", () => {
    const result = parseWorkbenchSnapshotImport("{not-json");

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({
        code: "invalid_json"
      })
    });
  });

  it("reports missing required fields during import parsing", () => {
    const result = parseWorkbenchSnapshotImport(
      JSON.stringify({
        version: 2,
        grouping: "companyType"
      })
    );

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({
        code: "missing_required_field",
        path: "companies"
      })
    });
  });

  it("falls back from legacy priority grouping during import parsing", () => {
    const result = parseWorkbenchSnapshotImport(
      JSON.stringify({
        version: 2,
        grouping: "priority",
        companies: sampleCompanies
      })
    );

    expect(result).toEqual({
      ok: true,
      snapshot: {
        version: 2,
        grouping: "companyType",
        companies: sampleCompanies
      }
    });
  });

  it("serializes snapshots for export using the same persisted shape", () => {
    const content = serializeWorkbenchSnapshot({
      version: 2,
      grouping: "stage",
      companies: sampleCompanies
    });

    expect(JSON.parse(content)).toEqual({
      version: 2,
      grouping: "stage",
      companies: sampleCompanies
    });
  });

  it("builds timestamped export filenames", () => {
    expect(getWorkbenchExportFilename(new Date("2026-04-19T09:30:00-07:00"))).toBe(
      "oh-my-todo-2026-04-19.json"
    );
  });

  it("creates an empty v2 workbench snapshot", () => {
    expect(createEmptyWorkbenchSnapshot()).toEqual({
      version: 2,
      grouping: "companyType",
      companies: []
    });
  });
});
