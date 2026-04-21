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
});

function seedWorkbench() {
  saveWorkbenchSnapshot({
    version: 2,
    grouping: "companyType",
    companies: sampleCompanies
  });
}

describe("App", () => {
  it("shows an empty-state entry point on first visit", () => {
    render(<App />);

    expect(screen.getByText(/数据默认只保存在当前浏览器/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "你的面试工作台还是空的" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "新建第一个公司" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "导入 JSON" })).toHaveLength(2);
  });

  it("renders the workbench shell and the default company-type groups", () => {
    seedWorkbench();
    render(<App />);

    expect(screen.getByRole("heading", { name: "面试工作台" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "未来 7 天面试" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "创业公司" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "大厂" })).toBeInTheDocument();
    expect(screen.getByText("归档流程（1）")).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.getByLabelText("分组切换")).toBeInTheDocument();
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
    expect(screen.getByRole("heading", { name: "Offer 对比" })).toBeInTheDocument();
  });

  it("explains the workbench as company judgment, interviews, and compensation comparison", () => {
    seedWorkbench();
    render(<App />);

    expect(
      screen.getByText(/直接维护公司判断、轮次时间、谈薪版本与最终对比/)
    ).toBeInTheDocument();
  });

  it("does not surface the start-negotiation CTA for early-stage inactive companies", async () => {
    seedWorkbench();
    const user = userEvent.setup();
    render(<App />);

    const novaCard = screen.getByText("Nova AI").closest("article");
    expect(novaCard).not.toBeNull();

    await user.click(within(novaCard!).getByRole("button", { name: "展开谈薪" }));

    expect(within(novaCard!).queryByRole("button", { name: "确认进入谈薪" })).not.toBeInTheDocument();
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
    expect(salaryField).toHaveValue("52000");

    await user.clear(salaryField);
    await user.type(salaryField, "53000");
    await user.click(within(airtableCard!).getByRole("button", { name: "保存谈薪快照" }));

    expect(await within(airtableCard!).findByText("第 2 轮谈薪")).toBeInTheDocument();
    const latestSummaryAfterSecondSave = within(airtableCard!)
      .getByText("最新快照")
      .closest(".company-card__negotiation-summary") as HTMLElement | null;
    expect(within(latestSummaryAfterSecondSave!).getByText("53,000 × 15 薪")).toBeInTheDocument();
    expect(within(airtableCard!).getByLabelText("月基本工资")).toHaveValue("53000");

    await user.clear(within(airtableCard!).getByLabelText("月基本工资"));
    await user.type(within(airtableCard!).getByLabelText("月基本工资"), "54000");
    await user.click(within(airtableCard!).getByRole("button", { name: "保存谈薪快照" }));

    expect(await within(airtableCard!).findByText("第 3 轮谈薪")).toBeInTheDocument();
    const latestSummaryAfterThirdSave = within(airtableCard!)
      .getByText("最新快照")
      .closest(".company-card__negotiation-summary") as HTMLElement | null;
    expect(within(latestSummaryAfterThirdSave!).getByText("54,000 × 15 薪")).toBeInTheDocument();
  });

  it("adds a pending round to the upcoming timeline when the user schedules it", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-17T09:00:00-07:00"));
    seedWorkbench();

    render(<App />);

    const timeline = screen.getByRole("heading", { name: "未来 7 天面试" }).closest("section");
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

    const timeline = screen.getByRole("heading", { name: "未来 7 天面试" }).closest("section");

    expect(within(timeline!).queryByText("ACME")).not.toBeInTheDocument();
    expect(within(timeline!).queryByText("字节跳动")).not.toBeInTheDocument();
  });

  it("renders the redesigned workbench landmarks for the hero, timeline, and archive areas", () => {
    seedWorkbench();
    render(<App />);

    expect(screen.getByText("Interview Workbench")).toBeInTheDocument();
    expect(screen.getByLabelText("工作台概览")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "活跃流程工作区" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "历史判断区" })).toBeInTheDocument();
    expect(screen.getByText("切换工作台视角")).toBeInTheDocument();
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

    await user.upload(screen.getByLabelText("导入工作台 JSON"), file);

    expect(await screen.findByText("Cursor")).toBeInTheDocument();
    expect(screen.getByText("导入成功，当前本地数据已替换。")).toBeInTheDocument();
  });

  it("clears persisted data after confirmation", async () => {
    seedWorkbench();
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);

    await user.click(screen.getByRole("button", { name: "清空本地数据" }));

    expect(screen.getByRole("heading", { name: "你的面试工作台还是空的" })).toBeInTheDocument();
    expect(confirmSpy).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });
});
