import type { CompanyRecord } from "../types/interview";
import { describe, expect, it } from "vitest";
import { sampleCompanies } from "./sampleData";
import {
  getActiveCompanies,
  getArchivedCompanies,
  getGroupedCompanies,
  getUpcomingInterviews
} from "./selectors";

const NOW = new Date("2026-04-17T09:00:00-07:00");
const multiProcessCompany: CompanyRecord = {
  id: "epsilon",
  name: "Epsilon",
  companyType: "startup",
  overallImpression: "测试用公司",
  processes: [
    {
      id: "epsilon-screening",
      roleName: "PM",
      stage: "screening",
      nextStep: "初筛",
      status: "active",
      rounds: []
    },
    {
      id: "epsilon-offer",
      roleName: "PM",
      stage: "offer",
      nextStep: "Offer",
      status: "active",
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
    expect(groups[0].companies.map((company) => company.name)).toEqual(["ACME", "Nova AI"]);
    expect(groups[1].companies.map((company) => company.name)).toEqual(["字节跳动"]);
  });

  it("uses the most advanced active stage when a company has multiple active processes", () => {
    const groups = getGroupedCompanies([...sampleCompanies, multiProcessCompany], "stage");

    expect(groups.map((group) => group.label)).toEqual(["筛选中", "面试中", "Offer 阶段"]);
    expect(groups[0].companies.map((company) => company.name)).toEqual(["Nova AI"]);
    expect(groups[1].companies.map((company) => company.name)).toEqual(["ACME", "字节跳动"]);
    expect(groups[2].companies.map((company) => company.name)).toEqual(["Epsilon"]);
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
