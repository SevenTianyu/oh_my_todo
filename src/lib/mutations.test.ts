import { describe, expect, it } from "vitest";
import { sampleCompanies } from "./sampleData";
import {
  addRoundToProcess,
  archiveProcessById,
  createCompanyWithProcess,
  deleteNegotiationSnapshot,
  finishNegotiation,
  saveNegotiationSnapshot,
  startNegotiation,
  updateProcessRecord,
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

  it("adds a new round to the selected process with the next default interview label", () => {
    const next = addRoundToProcess(sampleCompanies, "acme", "acme-pm");

    expect(next.find((company) => company.id === "acme")?.processes[0].rounds).toHaveLength(3);
    expect(next.find((company) => company.id === "acme")?.processes[0].rounds[2]?.name).toBe(
      "二面"
    );
  });

  it("creates a new company with a pending initial round and no process stage", () => {
    const next = createCompanyWithProcess(sampleCompanies, {
      companyName: "Cursor",
      companyType: "startup",
      roleName: "Product Lead"
    });

    expect(next[0]).toMatchObject({
      name: "Cursor",
      companyType: "startup",
      overallImpression: "",
      processes: [
        {
          roleName: "Product Lead",
          nextStep: "初筛沟通",
          status: "active",
          rounds: [
            {
              name: "初筛沟通",
              scheduledAt: null,
              status: "pending",
              notes: ""
            }
          ]
        }
      ]
    });
    expect(next[0].processes[0]).not.toHaveProperty("stage");
    expect(next[0].negotiation).toMatchObject({
      status: "inactive",
      sourceProcessId: null,
      startedAt: null,
      endedAt: null,
      latestSnapshotId: null,
      snapshots: []
    });
    expect(next[0].id).toBeTruthy();
    expect(next[0].processes[0].id).toBeTruthy();
    expect(next[0].processes[0].rounds[0].id).toBeTruthy();
  });

  it("archives only the targeted process", () => {
    const next = archiveProcessById(sampleCompanies, "acme", "acme-pm");

    expect(next.find((company) => company.id === "acme")?.processes[0].status).toBe("archived");
  });

  it("updates process-level fields immutably", () => {
    const next = updateProcessRecord(sampleCompanies, "acme", "acme-pm", {
      roleName: "Staff Product Manager"
    });

    expect(next.find((company) => company.id === "acme")?.processes[0].roleName).toBe(
      "Staff Product Manager"
    );
    expect(sampleCompanies.find((company) => company.id === "acme")?.processes[0].roleName).toBe(
      "Senior PM"
    );
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

  it("activates negotiation and appends immutable snapshots", () => {
    const started = startNegotiation(sampleCompanies, "acme", "acme-pm");
    const updated = saveNegotiationSnapshot(started, "acme", {
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
      equityPerShareValue: 18,
      equityVestingYears: 4,
      deadline: "2026-04-25",
      hrSignal: "可继续谈",
      notes: "首轮口头包"
    });
    const acme = updated.find((company) => company.id === "acme");

    expect(acme?.negotiation).toMatchObject({
      status: "active",
      sourceProcessId: "acme-pm",
      latestSnapshotId: expect.any(String)
    });
    expect(acme?.negotiation?.snapshots).toHaveLength(1);
    expect(sampleCompanies.find((company) => company.id === "acme")?.negotiation).toMatchObject({
      status: "inactive",
      sourceProcessId: null,
      snapshots: []
    });
  });

  it("keeps negotiation snapshot history immutable across multiple saves", () => {
    const started = startNegotiation(sampleCompanies, "acme", "acme-pm", "2026-04-25T09:00:00.000Z");
    const firstSaved = saveNegotiationSnapshot(started, "acme", {
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
      equityPerShareValue: 18,
      equityVestingYears: 4,
      deadline: "2026-04-25",
      hrSignal: "可继续谈",
      notes: "首轮口头包"
    });
    const secondSaved = saveNegotiationSnapshot(firstSaved, "acme", {
      title: "Senior PM",
      level: "P5",
      city: "San Francisco",
      workMode: "Hybrid",
      baseMonthlySalary: 52000,
      salaryMonths: 15,
      annualBonusCash: 130000,
      signOnBonus: 60000,
      relocationBonus: 0,
      equityShares: 4200,
      equityPerShareValue: 18,
      equityVestingYears: 4,
      deadline: "2026-04-27",
      hrSignal: "可继续谈",
      notes: "二轮口头包"
    });

    const originalAcme = sampleCompanies.find((company) => company.id === "acme");
    const firstAcme = firstSaved.find((company) => company.id === "acme");
    const secondAcme = secondSaved.find((company) => company.id === "acme");

    expect(originalAcme?.negotiation.snapshots).toHaveLength(0);
    expect(firstAcme?.negotiation.snapshots).toHaveLength(1);
    expect(firstAcme?.negotiation.snapshots[0].version).toBe(1);
    expect(secondAcme?.negotiation.snapshots).toHaveLength(2);
    expect(secondAcme?.negotiation.snapshots[0].version).toBe(1);
    expect(secondAcme?.negotiation.snapshots[1].version).toBe(2);
    expect(secondAcme?.negotiation.latestSnapshotId).toBe(
      secondAcme?.negotiation.snapshots[1].id
    );
  });

  it("finishes negotiation with a terminal status without deleting snapshot history", () => {
    const started = startNegotiation(sampleCompanies, "acme", "acme-pm", "2026-04-25T09:00:00.000Z");
    const updated = saveNegotiationSnapshot(started, "acme", {
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
      equityPerShareValue: 18,
      equityVestingYears: 4,
      deadline: "2026-04-25",
      hrSignal: "可继续谈",
      notes: "首轮口头包"
    });
    const finished = finishNegotiation(updated, "acme", "declined", "2026-04-26T09:00:00.000Z");
    const acme = finished.find((company) => company.id === "acme");

    expect(acme?.negotiation?.status).toBe("declined");
    expect(acme?.negotiation?.endedAt).toBe("2026-04-26T09:00:00.000Z");
    expect(acme?.negotiation?.snapshots.length).toBeGreaterThan(0);
  });

  it("resets negotiation history when restarting for a different process", () => {
    const company = {
      ...sampleCompanies[0],
      processes: [
        ...sampleCompanies[0].processes,
        {
          id: "acme-analytics",
          roleName: "Analytics PM",
          nextStep: "等待书面 offer",
          status: "active" as const,
          rounds: [
            {
              id: "acme-analytics-round-1",
              name: "终面",
              scheduledAt: "2026-04-23T15:00:00-07:00",
              status: "completed" as const,
              notes: "通过，HR 开始沟通 package"
            }
          ]
        }
      ],
      negotiation: {
        status: "declined" as const,
        sourceProcessId: "acme-pm",
        startedAt: "2026-04-20T09:00:00.000Z",
        endedAt: "2026-04-22T09:00:00.000Z",
        latestSnapshotId: "acme-negotiation-1",
        snapshots: [
          {
            id: "acme-negotiation-1",
            version: 1,
            createdAt: "2026-04-21T09:00:00.000Z",
            title: "Senior PM",
            level: "P5",
            city: "San Francisco",
            workMode: "Hybrid",
            baseMonthlySalary: 50000,
            salaryMonths: 15,
            annualBonusCash: 120000,
            signOnBonus: 40000,
            relocationBonus: 0,
            equityShares: 2000,
            equityPerShareValue: 16,
            equityVestingYears: 4,
            deadline: "2026-04-25",
            hrSignal: "原岗位已结束",
            notes: "上一条岗位的谈薪历史"
          }
        ]
      }
    };

    const restarted = startNegotiation(
      [company],
      "acme",
      "acme-analytics",
      "2026-04-27T09:00:00.000Z"
    );

    expect(restarted[0].negotiation).toMatchObject({
      status: "active",
      sourceProcessId: "acme-analytics",
      startedAt: "2026-04-27T09:00:00.000Z",
      endedAt: null,
      latestSnapshotId: null,
      snapshots: []
    });
  });

  it("deletes any negotiation snapshot, reindexes versions, and repoints the latest snapshot", () => {
    const company = {
      ...sampleCompanies[3],
      negotiation: {
        ...sampleCompanies[3].negotiation,
        latestSnapshotId: "negotiation-airtable-3",
        snapshots: [
          {
            ...sampleCompanies[3].negotiation.snapshots[0],
            id: "negotiation-airtable-1",
            version: 1,
            createdAt: "2026-04-18T18:00:00-07:00",
            notes: "第一轮"
          },
          {
            ...sampleCompanies[3].negotiation.snapshots[0],
            id: "negotiation-airtable-2",
            version: 2,
            createdAt: "2026-04-19T18:00:00-07:00",
            baseMonthlySalary: 53000,
            notes: "第二轮"
          },
          {
            ...sampleCompanies[3].negotiation.snapshots[0],
            id: "negotiation-airtable-3",
            version: 3,
            createdAt: "2026-04-20T18:00:00-07:00",
            baseMonthlySalary: 54000,
            notes: "第三轮"
          }
        ]
      }
    };

    const deletedMiddle = deleteNegotiationSnapshot([company], "airtable", "negotiation-airtable-2");

    expect(deletedMiddle[0].negotiation.latestSnapshotId).toBe("negotiation-airtable-3");
    expect(deletedMiddle[0].negotiation.snapshots).toMatchObject([
      { id: "negotiation-airtable-1", version: 1, notes: "第一轮" },
      { id: "negotiation-airtable-3", version: 2, notes: "第三轮" }
    ]);

    const deletedLatest = deleteNegotiationSnapshot(
      deletedMiddle,
      "airtable",
      "negotiation-airtable-3"
    );

    expect(deletedLatest[0].negotiation.latestSnapshotId).toBe("negotiation-airtable-1");
    expect(deletedLatest[0].negotiation.snapshots).toMatchObject([
      { id: "negotiation-airtable-1", version: 1, notes: "第一轮" }
    ]);

    const deletedLast = deleteNegotiationSnapshot(
      deletedLatest,
      "airtable",
      "negotiation-airtable-1"
    );

    expect(deletedLast[0].negotiation.status).toBe("active");
    expect(deletedLast[0].negotiation.latestSnapshotId).toBeNull();
    expect(deletedLast[0].negotiation.snapshots).toEqual([]);
  });
});
