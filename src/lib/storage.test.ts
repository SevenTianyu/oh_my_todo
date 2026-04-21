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

const defaultNegotiation = {
  status: "inactive" as const,
  sourceProcessId: null,
  startedAt: null,
  endedAt: null,
  latestSnapshotId: null,
  snapshots: []
};

const sampleCompaniesWithNegotiation = sampleCompanies.map((company) => ({
  ...company,
  negotiation: company.negotiation ?? defaultNegotiation
}));
const legacyCompanies = sampleCompanies.map(({ negotiation, ...company }) => company);
const legacyCompaniesWithNegotiation = legacyCompanies.map((company) => ({
  ...company,
  negotiation: defaultNegotiation
}));

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
    expect(snapshot?.companies).toEqual(sampleCompaniesWithNegotiation);
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
      companies: sampleCompaniesWithNegotiation
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
      processes: [],
      negotiation: defaultNegotiation
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
        companies: sampleCompaniesWithNegotiation
      }
    });
  });

  it("ignores legacy process stage fields when importing json", () => {
    const result = parseWorkbenchSnapshotImport(
      JSON.stringify({
        version: 2,
        grouping: "companyType",
        companies: [
          {
            id: "cursor",
            name: "Cursor",
            companyType: "startup",
            overallImpression: "",
            processes: [
              {
                id: "cursor-product",
                roleName: "Product Lead",
                stage: "interviewing",
                nextStep: "初筛",
                status: "active",
                rounds: [
                  {
                    id: "cursor-round-1",
                    name: "初筛",
                    scheduledAt: null,
                    status: "pending",
                    notes: ""
                  }
                ]
              }
            ]
          }
        ]
      })
    );

    expect(result).toEqual({
      ok: true,
      snapshot: {
        version: 2,
        grouping: "companyType",
        companies: [
          {
            id: "cursor",
            name: "Cursor",
            companyType: "startup",
            overallImpression: "",
            processes: [
              {
                id: "cursor-product",
                roleName: "Product Lead",
                nextStep: "初筛",
                status: "active",
                rounds: [
                  {
                    id: "cursor-round-1",
                    name: "初筛",
                    scheduledAt: null,
                    status: "pending",
                    notes: ""
                  }
                ]
              }
            ],
            negotiation: defaultNegotiation
          }
        ]
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
        companies: sampleCompaniesWithNegotiation
      }
    });
  });

  it("serializes snapshots for export using the same persisted shape", () => {
    const content = serializeWorkbenchSnapshot({
      version: 2,
      grouping: "stage",
      companies: legacyCompanies as never
    });

    expect(JSON.parse(content)).toEqual({
      version: 2,
      grouping: "stage",
      companies: legacyCompaniesWithNegotiation
    });
    expect(JSON.parse(content).companies[0].processes[0]).not.toHaveProperty("stage");
  });

  it("round-trips a populated negotiation payload through export and import", () => {
    const richSnapshot = {
      version: 2 as const,
      grouping: "companyType" as const,
      companies: [
        {
          ...sampleCompanies[0],
          negotiation: {
            status: "declined" as const,
            sourceProcessId: "acme-pm",
            startedAt: "2026-04-25T09:00:00.000Z",
            endedAt: "2026-04-26T09:00:00.000Z",
            latestSnapshotId: "negotiation-acme-1-abc123",
            snapshots: [
              {
                id: "negotiation-acme-1-abc123",
                version: 1,
                createdAt: "2026-04-25T09:10:00.000Z",
                title: "Senior PM",
                level: "P5",
                city: "San Francisco",
                workMode: "Hybrid",
                baseMonthlySalary: 50000,
                salaryMonths: 15,
                annualBonusCash: 120000,
                signOnBonus: 50000,
                relocationBonus: 0,
                equityShares: 4000,
                equityStrikePrice: 12,
                equityReferencePrice: 30,
                equityVestingYears: 4,
                deadline: "2026-04-25",
                hrSignal: "可继续谈",
                notes: "首轮口头包"
              }
            ]
          }
        }
      ]
    };

    const result = parseWorkbenchSnapshotImport(serializeWorkbenchSnapshot(richSnapshot));

    expect(result).toEqual({
      ok: true,
      snapshot: richSnapshot
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

  it("fills in a default inactive negotiation object when importing legacy json", () => {
    const result = parseWorkbenchSnapshotImport(
      JSON.stringify({
        version: 2,
        grouping: "companyType",
        companies: [
          {
            id: "cursor",
            name: "Cursor",
            companyType: "startup",
            overallImpression: "",
            processes: [
              {
                id: "cursor-product",
                roleName: "Product Lead",
                nextStep: "HR 面",
                status: "active",
                rounds: []
              }
            ]
          }
        ]
      })
    );

    expect(result.ok && result.snapshot.companies[0]?.negotiation?.status).toBe("inactive");
    expect(result.ok && result.snapshot.companies[0]?.negotiation?.snapshots).toEqual([]);
  });
});
