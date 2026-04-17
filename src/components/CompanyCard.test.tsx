import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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

  it("renders an editable datetime-local value for existing scheduled rounds", async () => {
    const user = userEvent.setup();
    const company = sampleCompanies[0];
    render(
      <CompanyCard
        company={company}
        onSaveSummary={() => {}}
        onAddRound={() => {}}
        onArchiveProcess={() => {}}
        onUpdateRound={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: `展开 ${company.name}` }));

    expect(screen.getByLabelText(`${company.name}-一面-时间`)).toHaveValue("2026-04-17T14:00");
  });

  it("normalizes round scheduling edits before dispatching them", async () => {
    const user = userEvent.setup();
    const company = sampleCompanies[0];
    const onUpdateRound = vi.fn();
    render(
      <CompanyCard
        company={company}
        onSaveSummary={() => {}}
        onAddRound={() => {}}
        onArchiveProcess={() => {}}
        onUpdateRound={onUpdateRound}
      />
    );

    await user.click(screen.getByRole("button", { name: `展开 ${company.name}` }));

    fireEvent.change(screen.getByLabelText(`${company.name}-一面-时间`), {
      target: { value: "" }
    });

    expect(onUpdateRound).toHaveBeenLastCalledWith("acme", "acme-pm", "acme-round-1", {
      scheduledAt: null,
      status: "pending"
    });
  });

  it("renders aligned editor rows inside dedicated layout containers", async () => {
    const user = userEvent.setup();
    const company = sampleCompanies[0];
    render(
      <CompanyCard
        company={company}
        onSaveSummary={() => {}}
        onAddRound={() => {}}
        onArchiveProcess={() => {}}
        onUpdateRound={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: `展开 ${company.name}` }));

    const summaryField = screen.getByLabelText("公司整体印象");
    const dateField = screen.getByLabelText(`${company.name}-一面-时间`);
    const notesField = screen.getByLabelText(`${company.name}-一面-备注`);

    expect(summaryField.closest(".company-card__summary-row")).not.toBeNull();
    expect(dateField.closest(".company-card__round-row")).not.toBeNull();
    expect(notesField.closest(".company-card__round-row")).toBe(dateField.closest(".company-card__round-row"));
  });
});
