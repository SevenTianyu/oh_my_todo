import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { sampleCompanies } from "./lib/sampleData";
import { saveWorkbenchSnapshot } from "./lib/storage";

afterEach(() => {
  vi.useRealTimers();
});

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.lang = "zh-CN";
});

function seedWorkbench() {
  saveWorkbenchSnapshot({
    version: 2,
    grouping: "companyType",
    companies: sampleCompanies
  });
}

describe("App", () => {
  it("shows a title-page style empty state on first visit", () => {
    render(<App />);

    expect(screen.getByText("先写下公司，再逐步补上时间、判断和谈薪记录。")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "从第一家公司开始建立判断台" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "新建第一个公司" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "导入数据" })).toHaveLength(2);
  });

  it("renders the workbench shell and the default company-type groups", () => {
    seedWorkbench();
    render(<App />);

    expect(screen.getByRole("heading", { name: "面试工作台" })).toBeInTheDocument();
    expect(screen.getByText("未来 7 天安排")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "创业公司" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "大厂" })).toBeInTheDocument();
    expect(screen.getAllByText("归档（1）")).toHaveLength(1);
    expect(screen.queryByText("历史判断档案（1）")).not.toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.getByLabelText("分组切换")).toBeInTheDocument();
  });

  it("renders the paper masthead shell and local-first status rail", () => {
    seedWorkbench();
    render(<App />);

    const masthead = screen.getByLabelText("工作台首页");
    expect(within(masthead).queryByText("个人面试工作台")).not.toBeInTheDocument();
    expect(
      within(masthead).getByText("把时间、判断和谈薪记录留在同一张个人工作台上。")
    ).toBeInTheDocument();
    expect(within(masthead).getByText("本地优先 / 无登录 / 可导入导出")).toBeInTheDocument();
    expect(within(masthead).getByRole("button", { name: "新建公司" })).toBeInTheDocument();
  });

  it("switches grouping tabs without reloading the page", async () => {
    seedWorkbench();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "按流程阶段分组" }));

    expect(screen.getByRole("heading", { name: "筛选中" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "面试中" })).toBeInTheDocument();
  });

  it("renders the offer comparison section and the negotiating lane", async () => {
    seedWorkbench();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "按流程阶段分组" }));

    expect(screen.getByRole("heading", { name: "谈薪中" })).toBeInTheDocument();
    expect(screen.getByText("薪资对比")).toBeInTheDocument();
    expect(screen.queryByText("报价对比")).not.toBeInTheDocument();
  });

  it("manages custom categories from the workbench UI", async () => {
    seedWorkbench();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "管理分类" }));
    const dialog = screen.getByRole("dialog", { name: "管理分类" });

    await user.type(within(dialog).getByLabelText("新分类名称"), "外企");
    await user.click(within(dialog).getByRole("button", { name: "新增分类" }));
    expect(within(dialog).getByDisplayValue("外企")).toBeInTheDocument();

    await user.clear(within(dialog).getByLabelText("分类名称 创业公司"));
    await user.type(within(dialog).getByLabelText("分类名称 创业公司"), "早期团队");
    await user.click(within(dialog).getByRole("button", { name: "保存 创业公司" }));

    expect(await screen.findByRole("heading", { name: "早期团队" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "创业公司" })).not.toBeInTheDocument();

    const startupRow = within(dialog)
      .getByDisplayValue("早期团队")
      .closest(".category-manager__row") as HTMLElement;
    expect(within(startupRow).getByRole("button", { name: "删除 早期团队" })).toBeDisabled();
    expect(within(startupRow).getByText(/先把 .* 家公司移到其他分类/)).toBeInTheDocument();
  });

  it("uses custom categories when creating and editing companies", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole("button", { name: "新建第一个公司" })[0]);
    await user.click(screen.getByRole("button", { name: "管理分类" }));
    await user.type(screen.getByLabelText("新分类名称"), "外企");
    await user.click(screen.getByRole("button", { name: "新增分类" }));
    await user.click(screen.getByRole("button", { name: "关闭" }));

    await user.type(screen.getByLabelText("公司名称"), "Stripe");
    const companyTypeSelect = screen.getByLabelText("公司类型") as HTMLSelectElement;
    const foreignOption = [...companyTypeSelect.options].find(
      (option) => option.textContent === "外企"
    );
    expect(foreignOption).toBeDefined();
    await user.selectOptions(companyTypeSelect, foreignOption!.value);
    await user.type(screen.getByLabelText("岗位名称"), "Product Lead");
    await user.click(screen.getByRole("button", { name: "保存到工作台" }));

    expect(screen.getByText("Stripe")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "外企" })).toBeInTheDocument();
  });

  it("explains the workbench as company judgment, interviews, and compensation comparison", () => {
    seedWorkbench();
    render(<App />);

    expect(
      screen.getByText(/直接维护公司判断、轮次时间、谈薪版本与最终对比/)
    ).toBeInTheDocument();
  });

  it("allows manually entering negotiation for early-stage inactive companies", async () => {
    seedWorkbench();
    const user = userEvent.setup();
    render(<App />);

    const novaCard = screen.getByText("Nova AI").closest("article");
    expect(novaCard).not.toBeNull();

    await user.click(within(novaCard!).getByRole("button", { name: "展开谈薪" }));

    expect(within(novaCard!).getByRole("button", { name: "确认进入谈薪" })).toBeInTheDocument();
    expect(
      within(novaCard!).getByText(/如果你已经开始和招聘方确认报价、总包或薪资空间，可以手动进入谈薪。/)
    ).toBeInTheDocument();
  });

  it("saves additional negotiation snapshots from the shipped UI and grows the history", async () => {
    seedWorkbench();
    const user = userEvent.setup();
    render(<App />);

    const airtableCard = screen
      .getAllByText("Airtable")
      .find((element) => element.closest("article")?.classList.contains("company-card"))
      ?.closest("article");
    expect(airtableCard).not.toBeNull();

    await user.click(within(airtableCard!).getByRole("button", { name: "展开谈薪" }));

    const salaryField = within(airtableCard!).getByLabelText("月基本工资");
    expect(within(airtableCard!).getByText("月基本工资（万元）")).toBeInTheDocument();
    expect(salaryField).toHaveValue("5.2");

    await user.clear(salaryField);
    await user.type(salaryField, "5.3");
    await user.click(within(airtableCard!).getByRole("button", { name: "保存谈薪快照" }));

    expect(await within(airtableCard!).findByText("第 2 轮谈薪")).toBeInTheDocument();
    const latestSummaryAfterSecondSave = within(airtableCard!)
      .getByText("最新快照")
      .closest(".company-card__negotiation-summary") as HTMLElement | null;
    expect(within(latestSummaryAfterSecondSave!).getByText("5.3 万 × 15 薪")).toBeInTheDocument();
    expect(within(airtableCard!).getByLabelText("月基本工资")).toHaveValue("5.3");

    await user.clear(within(airtableCard!).getByLabelText("月基本工资"));
    await user.type(within(airtableCard!).getByLabelText("月基本工资"), "5.4");
    await user.click(within(airtableCard!).getByRole("button", { name: "保存谈薪快照" }));

    expect(await within(airtableCard!).findByText("第 3 轮谈薪")).toBeInTheDocument();
    const latestSummaryAfterThirdSave = within(airtableCard!)
      .getByText("最新快照")
      .closest(".company-card__negotiation-summary") as HTMLElement | null;
    expect(within(latestSummaryAfterThirdSave!).getByText("5.4 万 × 15 薪")).toBeInTheDocument();
  });

  it("deletes negotiation snapshots from the shipped UI and reindexes the remaining history", async () => {
    seedWorkbench();
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);

    const airtableCard = screen
      .getAllByText("Airtable")
      .find((element) => element.closest("article")?.classList.contains("company-card"))
      ?.closest("article");
    expect(airtableCard).not.toBeNull();

    await user.click(within(airtableCard!).getByRole("button", { name: "展开谈薪" }));
    await user.clear(within(airtableCard!).getByLabelText("月基本工资"));
    await user.type(within(airtableCard!).getByLabelText("月基本工资"), "5.3");
    await user.click(within(airtableCard!).getByRole("button", { name: "保存谈薪快照" }));
    await user.clear(within(airtableCard!).getByLabelText("月基本工资"));
    await user.type(within(airtableCard!).getByLabelText("月基本工资"), "5.4");
    await user.click(within(airtableCard!).getByRole("button", { name: "保存谈薪快照" }));

    await user.click(within(airtableCard!).getByRole("button", { name: "删除第 2 轮谈薪" }));

    expect(confirmSpy).toHaveBeenCalledWith("确认删除第 2 轮谈薪吗？此操作不可撤销。");
    expect(within(airtableCard!).queryByText("第 3 轮谈薪")).not.toBeInTheDocument();
    expect(within(airtableCard!).getByText("第 2 轮谈薪")).toBeInTheDocument();
    const latestSummary = within(airtableCard!)
      .getByText("最新快照")
      .closest(".company-card__negotiation-summary") as HTMLElement | null;
    expect(within(latestSummary!).getByText("5.4 万 × 15 薪")).toBeInTheDocument();

    await user.click(within(airtableCard!).getByRole("button", { name: "删除第 2 轮谈薪" }));
    expect(within(airtableCard!).queryByText("第 2 轮谈薪")).not.toBeInTheDocument();
    expect(within(airtableCard!).getByText("第 1 轮谈薪")).toBeInTheDocument();

    await user.click(within(airtableCard!).getByRole("button", { name: "删除第 1 轮谈薪" }));
    expect(within(airtableCard!).getByText("还没有保存谈薪快照。")).toBeInTheDocument();
    expect(within(airtableCard!).queryByText("最新快照")).not.toBeInTheDocument();
    expect(within(airtableCard!).getByLabelText("月基本工资")).toHaveValue("");
  });

  it("adds a pending round to the upcoming timeline when the user schedules it", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-17T09:00:00-07:00"));
    seedWorkbench();

    render(<App />);

    const timeline = screen.getByText("未来 7 天安排").closest("section");
    expect(within(timeline!).queryByText("Nova AI")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "展开 Nova AI" })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "展开面试安排" })[1]);

    fireEvent.change(screen.getByLabelText("Nova AI-初筛沟通-时间"), {
      target: { value: "2026-04-20T09:30" }
    });

    expect(within(timeline!).getByText("Nova AI")).toBeInTheDocument();
    expect(within(timeline!).getByText("初筛沟通")).toBeInTheDocument();
  });

  it("uses the actual current date for the upcoming timeline window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T09:00:00-07:00"));
    seedWorkbench();

    render(<App />);

    const timeline = screen.getByText("未来 7 天安排").closest("section");

    expect(within(timeline!).queryByText("ACME")).not.toBeInTheDocument();
    expect(within(timeline!).queryByText("字节跳动")).not.toBeInTheDocument();
  });

  it("renders the redesigned workbench landmarks for the hero, timeline, and archive areas", () => {
    seedWorkbench();
    render(<App />);

    expect(screen.getByLabelText("工作台首页")).toBeInTheDocument();
    expect(screen.queryByText("个人面试工作台")).not.toBeInTheDocument();
    expect(screen.getByLabelText("工作台概览")).toBeInTheDocument();
    expect(screen.getByText("活跃流程工作区")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "活跃流程工作区" })).not.toBeInTheDocument();
    expect(screen.getAllByText("归档（1）")).toHaveLength(1);
    expect(screen.queryByRole("heading", { name: "历史判断区" })).not.toBeInTheDocument();
    expect(screen.getByText("工作台索引")).toBeInTheDocument();
  });

  it("renders fixed interface copy in English when the document language is English", async () => {
    document.documentElement.lang = "en";
    seedWorkbench();
    const user = userEvent.setup();
    render(<App />);
    const acmeCard = screen.getByRole("heading", { name: "ACME" }).closest("article");

    expect(screen.getByLabelText("Workbench Home")).toBeInTheDocument();
    expect(screen.queryByText("Personal Interview Desk")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Interview Workbench" })).toBeInTheDocument();
    expect(screen.getAllByText("Next 7 Days")).toHaveLength(2);
    expect(screen.queryByRole("heading", { name: "Next 7 Days" })).not.toBeInTheDocument();
    expect(screen.getByText("Active Pipeline")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Active Pipeline" })).not.toBeInTheDocument();
    expect(screen.getByText("Workbench Index")).toBeInTheDocument();
    expect(screen.getByText("Salary Comparison")).toBeInTheDocument();
    expect(screen.queryByText("Offer Comparison")).not.toBeInTheDocument();
    expect(screen.getAllByText("Archive (1)")).toHaveLength(1);
    expect(screen.queryByRole("heading", { name: "Archive" })).not.toBeInTheDocument();
    expect(acmeCard).not.toBeNull();

    await user.click(within(acmeCard!).getByRole("button", { name: "Expand Company Judgment" }));

    expect(within(acmeCard!).getByRole("heading", { name: "Company Judgment" })).toBeInTheDocument();
    expect(within(acmeCard!).getByRole("heading", { name: "Interview Schedule" })).toBeInTheDocument();
    expect(within(acmeCard!).getByText("Company Name")).toBeInTheDocument();
    expect(screen.queryByText("活跃流程工作区")).not.toBeInTheDocument();
    expect(screen.queryByText("工作台索引")).not.toBeInTheDocument();
  });

  it("switches interface language from the masthead and keeps the choice across reloads", async () => {
    seedWorkbench();
    const user = userEvent.setup();
    const view = render(<App />);

    expect(screen.getByLabelText("语言切换")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "EN" }));

    expect(document.documentElement.lang).toBe("en");
    expect(screen.getByRole("heading", { name: "Interview Workbench" })).toBeInTheDocument();
    expect(screen.getByLabelText("Language switcher")).toBeInTheDocument();

    view.unmount();
    document.documentElement.lang = "zh-CN";
    render(<App />);

    expect(screen.getByRole("heading", { name: "Interview Workbench" })).toBeInTheDocument();
    expect(screen.getByLabelText("Language switcher")).toBeInTheDocument();
  });

  it("shows archived negotiation summary and snapshot history inside the archive UI", () => {
    seedWorkbench();
    render(<App />);

    expect(screen.getByText("已接受结果，流程收口归档。")).toBeInTheDocument();

    const archiveCard = screen.getByText("Google").closest("details");
    expect(archiveCard).not.toBeNull();
    expect(archiveCard).not.toHaveAttribute("open");

    fireEvent.click(screen.getByText("Google"));

    expect(archiveCard).toHaveAttribute("open");
    expect(screen.getAllByText("归档（1）")).toHaveLength(1);
    expect(within(archiveCard!).getByRole("heading", { name: "谈薪结果" })).toBeInTheDocument();
    expect(within(archiveCard!).getByText("已接受")).toBeInTheDocument();
    expect(within(archiveCard!).getByText("关联岗位：PM")).toBeInTheDocument();
    expect(within(archiveCard!).getAllByText("4.2 万 × 15 薪")).toHaveLength(2);
    expect(within(archiveCard!).getByText("谈薪历史（1）")).toBeInTheDocument();
    expect(within(archiveCard!).getByText("版本 1")).toBeInTheDocument();
    expect(within(archiveCard!).getAllByText("最终包已接受")).toHaveLength(2);
    expect(screen.queryByText("历史判断档案（1）")).not.toBeInTheDocument();
    expect(screen.queryByText("保留已经走完的上下文")).not.toBeInTheDocument();
  });

  it("asks for an archive note before moving a process into the archive area", async () => {
    seedWorkbench();
    const user = userEvent.setup();
    render(<App />);

    const acmeCard = screen.getByRole("heading", { name: "ACME" }).closest("article");
    expect(acmeCard).not.toBeNull();

    await user.click(within(acmeCard!).getByRole("button", { name: "展开面试安排" }));
    await user.click(within(acmeCard!).getByRole("button", { name: "归档流程" }));

    const dialog = screen.getByRole("dialog", { name: "归档流程说明" });
    const confirmButton = within(dialog).getByRole("button", { name: "确认归档" });
    expect(confirmButton).toBeDisabled();

    await user.type(within(dialog).getByLabelText("归档说明"), "优先推进其他更匹配的机会");
    await user.click(confirmButton);

    expect(screen.queryByRole("dialog", { name: "归档流程说明" })).not.toBeInTheDocument();
    expect(screen.getByText("归档（2）")).toBeInTheDocument();
    expect(screen.getByText("优先推进其他更匹配的机会")).toBeInTheDocument();
  });

  it("creates a first company from the empty-state form and persists it across reloads", async () => {
    const user = userEvent.setup();
    const view = render(<App />);

    await user.click(screen.getAllByRole("button", { name: "新建第一个公司" })[0]);
    expect(screen.queryByLabelText("下一步")).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("公司名称"), "Anthropic");
    await user.selectOptions(screen.getByLabelText("公司类型"), "startup");
    await user.type(screen.getByLabelText("岗位名称"), "Product Manager");
    await user.click(screen.getByRole("button", { name: "保存到工作台" }));

    expect(screen.getByText("Anthropic")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "展开面试安排" }));
    expect(screen.getByText("下一步：初筛沟通")).toBeInTheDocument();

    view.unmount();
    render(<App />);

    expect(screen.getByText("Anthropic")).toBeInTheDocument();
  });

  it("exports the current workbench snapshot as json", async () => {
    seedWorkbench();
    const user = userEvent.setup();
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const createObjectURL = vi.fn(() => "blob:workbench-export");
    const revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: createObjectURL
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: revokeObjectURL
    });

    render(<App />);
    await user.click(screen.getByRole("button", { name: "导出数据" }));

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:workbench-export");

    clickSpy.mockRestore();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: originalCreateObjectURL
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: originalRevokeObjectURL
    });
  });

  it("imports a valid json snapshot and updates the board", async () => {
    const user = userEvent.setup();
    render(<App />);

    const file = new File(
      [
        JSON.stringify({
          version: 2,
          grouping: "companyType",
          companies: [
            {
              id: "cursor",
              name: "Cursor",
              companyType: "startup",
              overallImpression: "",
              processes: [
                {
                  id: "cursor-product",
                  roleName: "Product Lead",
                  nextStep: "初筛",
                  status: "active",
                  rounds: [
                    {
                      id: "cursor-round-1",
                      name: "初筛",
                      scheduledAt: null,
                      status: "pending",
                      notes: ""
                    }
                  ]
                }
              ]
            }
          ]
        })
      ],
      "cursor.json",
      { type: "application/json" }
    );

    await user.upload(screen.getByLabelText("导入工作台数据"), file);

    expect(await screen.findByText("Cursor")).toBeInTheDocument();
    expect(screen.getByText("导入成功，当前本地数据已替换。")).toBeInTheDocument();
  });

  it("clears persisted data after confirmation", async () => {
    seedWorkbench();
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);

    await user.click(screen.getByRole("button", { name: "清空本地数据" }));

    expect(screen.getByRole("heading", { name: "从第一家公司开始建立判断台" })).toBeInTheDocument();
    expect(confirmSpy).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });
});
