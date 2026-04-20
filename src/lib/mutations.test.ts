import { describe, expect, it } from "vitest";
import { sampleCompanies } from "./sampleData";
import {
  addRoundToProcess,
  archiveProcessById,
  createCompanyWithProcess,
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
});
