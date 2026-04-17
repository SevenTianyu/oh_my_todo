import { beforeEach, describe, expect, it } from "vitest";
import { sampleCompanies } from "./sampleData";
import { loadWorkbenchSnapshot, saveWorkbenchSnapshot } from "./storage";

describe("storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves and loads the workbench snapshot", () => {
    saveWorkbenchSnapshot({
      grouping: "priority",
      companies: sampleCompanies
    });

    const snapshot = loadWorkbenchSnapshot();

    expect(snapshot?.grouping).toBe("priority");
    expect(snapshot?.companies[0].name).toBe("ACME");
  });

  it("returns null when there is no saved snapshot", () => {
    expect(loadWorkbenchSnapshot()).toBeNull();
  });
});
