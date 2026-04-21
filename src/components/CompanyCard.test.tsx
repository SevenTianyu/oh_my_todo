import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CompanyCard } from "./CompanyCard";
import { sampleCompanies } from "../lib/sampleData";

describe("CompanyCard", () => {
  it("renders a unified overall impression preview with interview notes appended line-by-line", () => {
    const company = sampleCompanies[0];
    const { container } = render(
      <CompanyCard
        company={company}
        onSaveSummary={() => {}}
        onUpdateProcess={() => {}}
        onAddRound={() => {}}
        onArchiveProcess={() => {}}
        onUpdateRound={() => {}}
      />
    );

    const summaryBlock = container.querySelector(".company-card__summary-item");
    expect(summaryBlock).not.toBeNull();
    expect(summaryBlock).toHaveTextContent("整体印象");
    expect(summaryBlock).toHaveTextContent("团队强，方向贴合，但节奏偏快。");
    expect(summaryBlock).toHaveTextContent("2026-04-17 一面：关注 owner 意识");
    expect(summaryBlock).toHaveTextContent("2026-04-15 简历沟通：招聘经理反馈积极");
  });

  it("resyncs the impression draft when the company prop changes", async () => {
    const user = userEvent.setup();
    const company = sampleCompanies[0];
    const { rerender } = render(
      <CompanyCard
        company={company}
        onSaveSummary={() => {}}
        onUpdateProcess={() => {}}
        onAddRound={() => {}}
        onArchiveProcess={() => {}}
        onUpdateRound={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: "展开公司判断" }));
    const impressionField = screen.getByLabelText("公司整体印象");
    expect(impressionField).toHaveValue(company.overallImpression);

    rerender(
      <CompanyCard
        company={{ ...company, overallImpression: "新的整体判断" }}
        onSaveSummary={() => {}}
        onUpdateProcess={() => {}}
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
        onUpdateProcess={() => {}}
        onAddRound={() => {}}
        onArchiveProcess={() => {}}
        onUpdateRound={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: "展开面试安排" }));
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
        onUpdateProcess={() => {}}
        onAddRound={() => {}}
        onArchiveProcess={() => {}}
        onUpdateRound={onUpdateRound}
      />
    );

    await user.click(screen.getByRole("button", { name: "展开面试安排" }));
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
        onUpdateProcess={() => {}}
        onAddRound={() => {}}
        onArchiveProcess={() => {}}
        onUpdateRound={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: "展开公司判断" }));
    await user.click(screen.getByRole("button", { name: "展开面试安排" }));
    const summaryField = screen.getByLabelText("公司整体印象");
    const dateField = screen.getByLabelText(`${company.name}-一面-时间`);
    const notesField = screen.getByLabelText(`${company.name}-一面-备注`);

    expect(summaryField.closest(".company-card__summary-row")).not.toBeNull();
    expect(dateField.closest(".company-card__round-row")).not.toBeNull();
    expect(notesField.closest(".company-card__round-row")).toBe(dateField.closest(".company-card__round-row"));
  });

  it("auto-grows long textareas instead of leaving inner scroll regions", async () => {
    const originalScrollHeightDescriptor = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "scrollHeight"
    );

    Object.defineProperty(HTMLTextAreaElement.prototype, "scrollHeight", {
      configurable: true,
      get() {
        return this.value.length > 20 ? 184 : 92;
      }
    });

    try {
      const user = userEvent.setup();
      const company = sampleCompanies[0];
      render(
        <CompanyCard
          company={{
            ...company,
            overallImpression:
              "这是一段明显更长的整体印象文本，用来验证文本域会根据内容自动增高，而不是继续保持固定高度。"
          }}
          onSaveSummary={() => {}}
          onUpdateProcess={() => {}}
          onAddRound={() => {}}
          onArchiveProcess={() => {}}
          onUpdateRound={() => {}}
        />
      );

      await user.click(screen.getByRole("button", { name: "展开公司判断" }));
      const impressionField = screen.getByLabelText("公司整体印象");
      expect(impressionField).toHaveStyle({ height: "184px" });

      await user.clear(impressionField);
      await user.type(impressionField, "短文本");

      expect(impressionField).toHaveStyle({ height: "92px" });
    } finally {
      if (originalScrollHeightDescriptor) {
        Object.defineProperty(
          HTMLTextAreaElement.prototype,
          "scrollHeight",
          originalScrollHeightDescriptor
        );
      } else {
        delete (HTMLTextAreaElement.prototype as { scrollHeight?: number }).scrollHeight;
      }
    }
  });

  it("saves the editable company fields and collapses only the summary section", async () => {
    const user = userEvent.setup();
    const company = sampleCompanies[0];
    const onSaveSummary = vi.fn();
    render(
      <CompanyCard
        company={company}
        onSaveSummary={onSaveSummary}
        onUpdateProcess={() => {}}
        onAddRound={() => {}}
        onArchiveProcess={() => {}}
        onUpdateRound={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: "展开公司判断" }));
    expect(screen.getByRole("button", { name: "展开面试安排" })).toBeInTheDocument();
    await user.clear(screen.getByLabelText("公司名称"));
    await user.type(screen.getByLabelText("公司名称"), "Aha");
    await user.selectOptions(screen.getByLabelText("公司类型"), "big-tech");
    await user.clear(screen.getByLabelText("公司整体印象"));
    await user.type(screen.getByLabelText("公司整体印象"), "新的整体判断");
    await user.click(screen.getByRole("button", { name: "保存公司判断" }));

    expect(onSaveSummary).toHaveBeenCalledWith("acme", {
      name: "Aha",
      companyType: "big-tech",
      overallImpression: "新的整体判断"
    });
    expect(screen.queryByRole("button", { name: `展开 ${company.name}` })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: `收起 ${company.name}` })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("公司名称")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(`${company.name}-一面-时间`)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "展开公司判断" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "展开面试安排" })).toBeInTheDocument();
  });

  it("renders a save button for interview scheduling edits and collapses only the interview section", async () => {
    const user = userEvent.setup();
    const company = sampleCompanies[0];
    render(
      <CompanyCard
        company={company}
        onSaveSummary={() => {}}
        onUpdateProcess={() => {}}
        onAddRound={() => {}}
        onArchiveProcess={() => {}}
        onUpdateRound={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: "展开面试安排" }));
    expect(screen.getByRole("button", { name: "保存面试安排" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "保存面试安排" }));

    expect(screen.queryByRole("button", { name: `展开 ${company.name}` })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: `收起 ${company.name}` })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(`${company.name}-一面-时间`)).not.toBeInTheDocument();
    expect(screen.queryByLabelText("公司名称")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "展开公司判断" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "展开面试安排" })).toBeInTheDocument();
  });

  it("edits a process role name inline with cancel and save affordances", async () => {
    const user = userEvent.setup();
    const company = sampleCompanies[0];
    const onUpdateProcess = vi.fn();
    render(
      <CompanyCard
        company={company}
        onSaveSummary={() => {}}
        onUpdateProcess={onUpdateProcess}
        onAddRound={() => {}}
        onArchiveProcess={() => {}}
        onUpdateRound={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: "展开面试安排" }));
    await user.click(screen.getByRole("button", { name: "编辑岗位名称 Senior PM" }));

    const roleNameField = screen.getByLabelText("岗位名称");
    expect(roleNameField).toHaveValue("Senior PM");
    expect(screen.getByRole("button", { name: "取消岗位名称修改" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存岗位名称" })).toBeInTheDocument();

    await user.clear(roleNameField);
    await user.type(roleNameField, "Staff Product Manager");
    await user.click(screen.getByRole("button", { name: "保存岗位名称" }));

    expect(onUpdateProcess).toHaveBeenCalledWith("acme", "acme-pm", {
      roleName: "Staff Product Manager"
    });
    expect(screen.queryByLabelText("岗位名称")).not.toBeInTheDocument();
  });

  it("edits a round name inline with cancel and save affordances", async () => {
    const user = userEvent.setup();
    const company = sampleCompanies[0];
    const onUpdateRound = vi.fn();
    render(
      <CompanyCard
        company={company}
        onSaveSummary={() => {}}
        onUpdateProcess={() => {}}
        onAddRound={() => {}}
        onArchiveProcess={() => {}}
        onUpdateRound={onUpdateRound}
      />
    );

    await user.click(screen.getByRole("button", { name: "展开面试安排" }));
    await user.click(screen.getByRole("button", { name: "编辑面试名称 一面" }));

    const roundNameField = screen.getByLabelText("面试名称");
    expect(roundNameField).toHaveValue("一面");
    expect(screen.getByRole("button", { name: "取消面试名称修改" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存面试名称" })).toBeInTheDocument();

    await user.clear(roundNameField);
    await user.type(roundNameField, "技术一面");
    await user.click(screen.getByRole("button", { name: "保存面试名称" }));

    expect(onUpdateRound).toHaveBeenCalledWith("acme", "acme-pm", "acme-round-1", {
      name: "技术一面"
    });
    expect(screen.queryByLabelText("面试名称")).not.toBeInTheDocument();
  });

  it("shows the third negotiation section and lets the user activate it from a suggestion", async () => {
    const user = userEvent.setup();
    const onStartNegotiation = vi.fn();

    render(
      <CompanyCard
        company={{
          ...sampleCompanies[1],
          negotiation: {
            status: "inactive",
            sourceProcessId: null,
            startedAt: null,
            endedAt: null,
            latestSnapshotId: null,
            snapshots: []
          }
        }}
        onSaveSummary={() => {}}
        onUpdateProcess={() => {}}
        onAddRound={() => {}}
        onArchiveProcess={() => {}}
        onUpdateRound={() => {}}
        negotiationSuggestionProcessId="nova-product"
        onStartNegotiation={onStartNegotiation}
        onSaveNegotiationSnapshot={() => {}}
        onFinishNegotiation={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: "展开谈薪" }));
    await user.click(screen.getByRole("button", { name: "确认进入谈薪" }));

    expect(onStartNegotiation).toHaveBeenCalledWith("nova", "nova-product");
  });

  it("renders snapshot history newest-first inside the negotiation section", async () => {
    const user = userEvent.setup();
    render(
      <CompanyCard
        company={{
          ...sampleCompanies[0],
          negotiation: {
            ...sampleCompanies[0].negotiation,
            status: "active",
            sourceProcessId: "acme-pm",
            latestSnapshotId: "acme-negotiation-2",
            snapshots: [
              ...sampleCompanies[0].negotiation.snapshots,
              {
                id: "acme-negotiation-1",
                version: 1,
                createdAt: "2026-04-18T09:00:00.000Z",
                title: "Senior PM",
                level: "P5",
                city: "San Francisco",
                workMode: "Hybrid",
                baseMonthlySalary: 45000,
                salaryMonths: 15,
                annualBonusCash: 120000,
                signOnBonus: 30000,
                relocationBonus: 10000,
                equityShares: 2000,
                equityStrikePrice: 12,
                equityReferencePrice: 28,
                equityVestingYears: 4,
                deadline: "2026-04-25",
                hrSignal: "继续推进",
                notes: "等待书面确认"
              },
              {
                id: "acme-negotiation-2",
                version: 2,
                createdAt: "2026-04-19T09:00:00.000Z",
                title: "Senior PM",
                level: "P5",
                city: "San Francisco",
                workMode: "Hybrid",
                baseMonthlySalary: 47000,
                salaryMonths: 15,
                annualBonusCash: 130000,
                signOnBonus: 50000,
                relocationBonus: 10000,
                equityShares: 2200,
                equityStrikePrice: 12,
                equityReferencePrice: 28,
                equityVestingYears: 4,
                deadline: "2026-04-26",
                hrSignal: "等待回复",
                notes: "补充 sign-on"
              }
            ]
          }
        }}
        onSaveSummary={() => {}}
        onUpdateProcess={() => {}}
        onAddRound={() => {}}
        onArchiveProcess={() => {}}
        onUpdateRound={() => {}}
        onStartNegotiation={() => {}}
        onSaveNegotiationSnapshot={() => {}}
        onFinishNegotiation={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: "展开谈薪" }));

    const versionTwo = screen.getByText("第 2 轮谈薪");
    const versionOne = screen.getByText("第 1 轮谈薪");
    expect(versionTwo).toBeInTheDocument();
    expect(versionOne).toBeInTheDocument();
    expect(versionTwo.compareDocumentPosition(versionOne)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
