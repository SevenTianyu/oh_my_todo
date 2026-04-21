import type { CompanyRecord } from "../types/interview";
import { describe, expect, it } from "vitest";
import { sampleCompanies } from "./sampleData";
import { createCompanyWithProcess, updateRoundRecord } from "./mutations";
import {
  getActiveCompanies,
  getArchivedCompanies,
  getGroupedCompanies,
  getOfferComparisonCompanies,
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
