import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CompanyCard } from "./CompanyCard";
import { sampleCompanies } from "../lib/sampleData";

describe("CompanyCard", () => {
  it("resyncs the impression draft when the company prop changes", async () => {
    const user = userEvent.setup();
    const company = sampleCompanies[0];
    const { rerender } = render(
      <CompanyCard
        company={company}
        onSaveSummary={() => {}}
        onAddRound={() => {}}
        onArchiveProcess={() => {}}
        onUpdateRound={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: `展开 ${company.name}` }));

    const impressionField = screen.getByLabelText("公司整体印象");
    expect(impressionField).toHaveValue(company.overallImpression);

    rerender(
      <CompanyCard
        company={{ ...company, overallImpression: "新的整体判断" }}
        onSaveSummary={() => {}}
        onAddRound={() => {}}
        onArchiveProcess={() => {}}
        onUpdateRound={() => {}}
      />
    );

    expect(screen.getByLabelText("公司整体印象")).toHaveValue("新的整体判断");
  });
});
