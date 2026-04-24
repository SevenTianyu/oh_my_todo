import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CategoryManager } from "./CategoryManager";
import type { CompanyCategory } from "../types/interview";

const categories: CompanyCategory[] = [
  { id: "startup", name: "创业公司", order: 0 },
  { id: "big-tech", name: "大厂", order: 1 },
  { id: "foreign", name: "外企", order: 2 }
];

describe("CategoryManager", () => {
  it("adds a trimmed category", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn(() => ({ ok: true as const }));

    render(
      <CategoryManager
        open
        companyCategories={categories}
        categoryUsage={{ startup: 1, "big-tech": 1, foreign: 0 }}
        onCreateCategory={onCreate}
        onRenameCategory={() => ({ ok: true as const })}
        onMoveCategory={() => {}}
        onDeleteCategory={() => ({ ok: true as const })}
        onClose={() => {}}
      />
    );

    await user.type(screen.getByLabelText("新分类名称"), " 中厂 ");
    await user.click(screen.getByRole("button", { name: "新增分类" }));

    expect(onCreate).toHaveBeenCalledWith(" 中厂 ");
  });

  it("shows a duplicate-name error from create", async () => {
    const user = userEvent.setup();

    render(
      <CategoryManager
        open
        companyCategories={categories}
        categoryUsage={{ startup: 1, "big-tech": 1, foreign: 0 }}
        onCreateCategory={() => ({ ok: false, error: "duplicate" })}
        onRenameCategory={() => ({ ok: true as const })}
        onMoveCategory={() => {}}
        onDeleteCategory={() => ({ ok: true as const })}
        onClose={() => {}}
      />
    );

    await user.type(screen.getByLabelText("新分类名称"), "创业公司");
    await user.click(screen.getByRole("button", { name: "新增分类" }));

    expect(screen.getByText("已经有同名分类。")).toBeInTheDocument();
  });

  it("renames and reorders categories", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn(() => ({ ok: true as const }));
    const onMove = vi.fn();

    render(
      <CategoryManager
        open
        companyCategories={categories}
        categoryUsage={{ startup: 1, "big-tech": 1, foreign: 0 }}
        onCreateCategory={() => ({ ok: true as const })}
        onRenameCategory={onRename}
        onMoveCategory={onMove}
        onDeleteCategory={() => ({ ok: true as const })}
        onClose={() => {}}
      />
    );

    const foreignRow = screen
      .getByDisplayValue("外企")
      .closest(".category-manager__row") as HTMLElement;
    await user.clear(within(foreignRow).getByLabelText("分类名称 外企"));
    await user.type(within(foreignRow).getByLabelText("分类名称 外企"), "外资公司");
    await user.click(within(foreignRow).getByRole("button", { name: "保存 外企" }));
    await user.click(within(foreignRow).getByRole("button", { name: "上移 外企" }));

    expect(onRename).toHaveBeenCalledWith("foreign", "外资公司");
    expect(onMove).toHaveBeenCalledWith("foreign", "up");
  });

  it("blocks deleting categories that still have companies", async () => {
    render(
      <CategoryManager
        open
        companyCategories={categories}
        categoryUsage={{ startup: 1, "big-tech": 1, foreign: 0 }}
        onCreateCategory={() => ({ ok: true as const })}
        onRenameCategory={() => ({ ok: true as const })}
        onMoveCategory={() => {}}
        onDeleteCategory={() => ({ ok: true as const })}
        onClose={() => {}}
      />
    );

    const startupRow = screen
      .getByDisplayValue("创业公司")
      .closest(".category-manager__row") as HTMLElement;
    expect(within(startupRow).getByRole("button", { name: "删除 创业公司" })).toBeDisabled();
    expect(within(startupRow).getByText("先把 1 家公司移到其他分类")).toBeInTheDocument();
  });
});
