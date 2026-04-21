import type { CompanyRecord } from "../types/interview";
import { describe, expect, it } from "vitest";
import { sampleCompanies } from "./sampleData";
import { createCompanyWithProcess, updateRoundRecord } from "./mutations";
import {
  getActiveCompanies,
  getArchivedCompanies,
  getGroupedCompanies,
  getOfferComparisonCompanies,
  getOfferComparisonRows,
  getNegotiationSuggestionProcessIds,
  getUpcomingInterviews
} from "./selectors";

const NOW = new Date("2026-04-17T09:00:00-07:00");
const defaultNegotiation = {
  status: "inactive" as const,
  sourceProcessId: null,
  startedAt: null,
  endedAt: null,
  latestSnapshotId: null,
  snapshots: []
};
const multiProcessCompany: CompanyRecord = {
  id: "epsilon",
  name: "Epsilon",
  companyType: "startup",
  overallImpression: "测试用公司",
  negotiation: defaultNegotiation,
  processes: [
    {
      id: "epsilon-screening",
      roleName: "PM",
      nextStep: "初筛",
      status: "active",
      rounds: []
    },
    {
      id: "epsilon-offer",
      roleName: "PM",
      nextStep: "复盘",
      status: "active",
      rounds: [
        {
          id: "epsilon-offer-round",
          name: "一面",
          scheduledAt: null,
          status: "completed",
          notes: ""
        }
      ]
    }
  ]
};
const negotiatingOnlyCompany: CompanyRecord = {
  id: "lambda",
  name: "Lambda",
  companyType: "startup",
  overallImpression: "测试用谈薪公司",
  negotiation: {
    status: "active",
    sourceProcessId: "lambda-pm",
    startedAt: "2026-04-19T09:00:00.000Z",
    endedAt: null,
    latestSnapshotId: null,
    snapshots: []
  },
  processes: [
    {
      id: "lambda-pm",
      roleName: "PM",
      nextStep: "结束",
      status: "archived",
      rounds: []
    }
  ]
};
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
    expect(groups[0].companies.map((company) => company.name)).toEqual([
      "ACME",
      "Nova AI",
      "Airtable"
    ]);
    expect(groups[1].companies.map((company) => company.name)).toEqual(["字节跳动"]);
  });

  it("groups stage using derived progress only", () => {
    const created = createCompanyWithProcess([], {
      companyName: "Cursor",
      companyType: "startup",
      roleName: "Product Lead"
    })[0];
    const scheduled = updateRoundRecord(
      [created],
      created.id,
      created.processes[0].id,
      created.processes[0].rounds[0].id,
      {
        scheduledAt: "2026-04-17T10:00:00-07:00",
        status: "scheduled"
      }
    )[0];

    const groups = getGroupedCompanies([...sampleCompanies, multiProcessCompany, scheduled], "stage");

    expect(groups.map((group) => group.label)).toEqual(["筛选中", "面试中", "谈薪中"]);
    expect(groups[0].companies.map((company) => company.name)).toEqual(["Nova AI"]);
    expect(groups[1].companies.map((company) => company.name)).toEqual([
      "ACME",
      "字节跳动",
      "Epsilon",
      "Cursor"
    ]);
    expect(groups[2].companies.map((company) => company.name)).toEqual(["Airtable"]);
  });

  it("prioritizes active negotiation over interviewing when grouping by stage", () => {
    const groups = getGroupedCompanies(sampleCompanies, "stage");

    expect(groups.map((group) => group.label)).toEqual(["筛选中", "面试中", "谈薪中"]);
    expect(groups[2].companies.map((company) => company.name)).toEqual(["Airtable"]);
  });

  it("includes active negotiation companies on the active board even without active processes", () => {
    const activeCompanies = getActiveCompanies([...sampleCompanies, negotiatingOnlyCompany]);
    const stageGroups = getGroupedCompanies([...sampleCompanies, negotiatingOnlyCompany], "stage");
    const archivedCompanies = getArchivedCompanies([...sampleCompanies, negotiatingOnlyCompany]);

    expect(activeCompanies.map((company) => company.name)).toEqual([
      "ACME",
      "Nova AI",
      "字节跳动",
      "Airtable",
      "Lambda"
    ]);
    expect(stageGroups[2].companies.map((company) => company.name)).toEqual([
      "Airtable",
      "Lambda"
    ]);
    expect(archivedCompanies.map((company) => company.name)).toEqual(["Google"]);
  });

  it("filters offer comparison companies by active or any saved negotiation snapshots", () => {
    const allScoped = getOfferComparisonCompanies([...sampleCompanies, negotiatingOnlyCompany], "all");
    const activeScoped = getOfferComparisonCompanies(
      [...sampleCompanies, negotiatingOnlyCompany],
      "active"
    );

    expect(allScoped.map((company) => company.name)).toEqual(["Airtable", "Google"]);
    expect(activeScoped.map((company) => company.name)).toEqual(["Airtable", "Lambda"]);
  });

  it("derives offer comparison rows from the latest snapshot and resolved source process role", () => {
    const rows = getOfferComparisonRows(sampleCompanies, "all");

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      companyId: "airtable",
      companyName: "Airtable",
      sourceProcessId: "airtable-staff-pm",
      sourceRoleName: "Staff PM",
      latestVersion: 1,
      latestSnapshot: {
        id: "negotiation-airtable-1"
      },
      metrics: {
        firstYearCash: 1010000,
        equityAnnualized: 26250,
        firstYearTotal: 1036250,
        longTermAnnualizedTotal: 956250
      }
    });
    expect(rows[1]).toMatchObject({
      companyId: "google",
      companyName: "Google",
      sourceProcessId: "google-ads",
      sourceRoleName: "PM",
      latestVersion: 1,
      latestSnapshot: {
        id: "negotiation-google-1"
      },
      metrics: {
        firstYearCash: 780000,
        equityAnnualized: 25000,
        firstYearTotal: 805000,
        longTermAnnualizedTotal: 755000
      }
    });
  });

  it("skips malformed offer comparison rows when the source process cannot be resolved", () => {
    const rows = getOfferComparisonRows([
      {
        ...sampleCompanies[0],
        negotiation: {
          status: "active",
          sourceProcessId: "missing-process",
          startedAt: "2026-04-19T09:00:00.000Z",
          endedAt: null,
          latestSnapshotId: "acme-negotiation-2",
          snapshots: [
            {
              id: "acme-negotiation-1",
              version: 1,
              createdAt: "2026-04-20T09:00:00.000Z",
              title: "Old title",
              level: "P5",
              city: "San Francisco",
              workMode: "Hybrid",
              baseMonthlySalary: 50000,
              salaryMonths: 15,
              annualBonusCash: 120000,
              signOnBonus: 20000,
              relocationBonus: 0,
              equityShares: 1000,
              equityStrikePrice: 10,
              equityReferencePrice: 20,
              equityVestingYears: 4,
              deadline: "2026-04-25",
              hrSignal: "可继续谈",
              notes: ""
            },
            {
              id: "acme-negotiation-2",
              version: 2,
              createdAt: "2026-04-21T09:00:00.000Z",
              title: "Latest title",
              level: "P6",
              city: "San Francisco",
              workMode: "Hybrid",
              baseMonthlySalary: 52000,
              salaryMonths: 15,
              annualBonusCash: 130000,
              signOnBonus: 30000,
              relocationBonus: 0,
              equityShares: 1200,
              equityStrikePrice: 10,
              equityReferencePrice: 22,
              equityVestingYears: 4,
              deadline: "2026-04-27",
              hrSignal: "可继续谈",
              notes: ""
            }
          ]
        }
      }
    ], "active");

    expect(rows).toEqual([]);
  });

  it("does not suggest negotiation for early-stage screening processes", () => {
    expect(getNegotiationSuggestionProcessIds(sampleCompanies)).toEqual({});
  });

  it("suggests only late-stage active processes with negotiation signals instead of the first active process", () => {
    const company: CompanyRecord = {
      id: "zenith",
      name: "Zenith",
      companyType: "startup",
      overallImpression: "测试候选公司",
      negotiation: defaultNegotiation,
      processes: [
        {
          id: "zenith-screening",
          roleName: "PM",
          nextStep: "初筛沟通",
          status: "active",
          rounds: [
            {
              id: "zenith-screening-round-1",
              name: "初筛沟通",
              scheduledAt: null,
              status: "pending",
              notes: "刚投递"
            }
          ]
        },
        {
          id: "zenith-offer",
          roleName: "Principal PM",
          nextStep: "HR 面",
          status: "active",
          rounds: [
            {
              id: "zenith-offer-round-1",
              name: "终面",
              scheduledAt: "2026-04-20T10:00:00-07:00",
              status: "completed",
              notes: "面试通过，HR 将沟通 package"
            }
          ]
        }
      ]
    };

    expect(getNegotiationSuggestionProcessIds([company])).toEqual({
      zenith: "zenith-offer"
    });
  });

  it("keeps fully archived companies out of the active board", () => {
    expect(getActiveCompanies(sampleCompanies).map((company) => company.name)).toEqual([
      "ACME",
      "Nova AI",
      "字节跳动",
      "Airtable"
    ]);

    expect(getArchivedCompanies(sampleCompanies).map((company) => company.name)).toEqual([
      "Google"
    ]);
  });
});
