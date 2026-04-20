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
    await user.selectOptions(screen.getByLabelText("流程阶段"), "interviewing");
    await user.click(screen.getByRole("button", { name: "保存到工作台" }));

    expect(screen.getByText("Anthropic")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "展开面试安排" }));
    expect(screen.getByText("下一步：一面")).toBeInTheDocument();

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
                  stage: "screening",
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
