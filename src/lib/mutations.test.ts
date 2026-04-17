import { describe, expect, it } from "vitest";
import { sampleCompanies } from "./sampleData";
import {
  addRoundToProcess,
  archiveProcessById,
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

  it("adds a new round to the selected process", () => {
    const next = addRoundToProcess(sampleCompanies, "acme", "acme-pm");

    expect(next.find((company) => company.id === "acme")?.processes[0].rounds).toHaveLength(3);
  });

  it("archives only the targeted process", () => {
    const next = archiveProcessById(sampleCompanies, "acme", "acme-pm");

    expect(next.find((company) => company.id === "acme")?.processes[0].status).toBe("archived");
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
