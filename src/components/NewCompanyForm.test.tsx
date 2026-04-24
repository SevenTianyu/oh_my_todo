import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewCompanyForm } from "./NewCompanyForm";

describe("NewCompanyForm", () => {
  beforeEach(() => {
    document.documentElement.lang = "zh-CN";
  });

  it("renders dynamic category options in order and submits the first ordered category by default", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const companyCategories = [
      { id: "foreign", name: "外企", order: 2 },
      { id: "startup", name: "早期团队", order: 0 },
      { id: "big-tech", name: "大厂", order: 1 }
    ];

    render(<NewCompanyForm companyCategories={companyCategories} onSubmit={onSubmit} />);

    const companyTypeField = screen.getByLabelText("公司类型");
    const options = within(companyTypeField).getAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual(["早期团队", "大厂", "外企"]);
    expect(companyTypeField).toHaveValue("startup");
    expect(screen.queryByRole("button", { name: "管理分类" })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("公司名称"), "Aha");
    await user.type(screen.getByLabelText("岗位名称"), "Product Lead");
    await user.click(screen.getByRole("button", { name: "保存到工作台" }));

    expect(onSubmit).toHaveBeenCalledWith({
      companyName: "Aha",
      companyType: "startup",
      roleName: "Product Lead"
    });
  });

  it("renders the category management action only when a handler is provided", async () => {
    const user = userEvent.setup();
    const onManageCategories = vi.fn();

    render(
      <NewCompanyForm
        companyCategories={[{ id: "startup", name: "早期团队", order: 0 }]}
        onManageCategories={onManageCategories}
        onSubmit={() => {}}
      />
    );

    const companyTypeField = screen.getByLabelText("公司类型").closest(".composer-field");
    expect(companyTypeField).not.toBeNull();
    expect(
      within(companyTypeField as HTMLElement).getByRole("button", { name: "管理分类" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "管理分类" }));

    expect(onManageCategories).toHaveBeenCalledOnce();
  });
});
