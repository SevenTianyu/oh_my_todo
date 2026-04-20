import { describe, expect, it } from "vitest";
import { sampleCompanies } from "./sampleData";
import {
  addRoundToProcess,
  archiveProcessById,
  createCompanyWithProcess,
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
      equityStrikePrice: 12,
      equityReferencePrice: 30,
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
      equityStrikePrice: 12,
      equityReferencePrice: 30,
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
});
