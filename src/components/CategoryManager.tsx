import { useEffect, useMemo, useRef, useState } from "react";
import { resolveAppLocale, type AppLocale } from "../lib/locale";
import type { CategoryMutationError } from "../lib/mutations";
import type { CompanyCategory } from "../types/interview";

type CategoryActionResult = { ok: true } | { ok: false; error: CategoryMutationError };

interface CategoryManagerProps {
  open: boolean;
  companyCategories: CompanyCategory[];
  categoryUsage: Record<string, number>;
  onCreateCategory: (name: string) => CategoryActionResult;
  onRenameCategory: (categoryId: string, name: string) => CategoryActionResult;
  onMoveCategory: (categoryId: string, direction: "up" | "down") => void;
  onDeleteCategory: (categoryId: string) => CategoryActionResult;
  onClose: () => void;
}

function getCopy(locale: AppLocale) {
  return locale === "en"
    ? {
        title: "Manage Categories",
        description: "Categories control the company-type lanes and the dropdowns on company cards.",
        newName: "New category name",
        add: "Add Category",
        close: "Close",
        categoryName: (name: string) => `Category name ${name}`,
        save: (name: string) => `Save ${name}`,
        moveUp: (name: string) => `Move up ${name}`,
        moveDown: (name: string) => `Move down ${name}`,
        delete: (name: string) => `Delete ${name}`,
        inUse: (count: number) => `Move ${count} companies to another category first`,
        empty: "No companies",
        errors: {
          blank: "Category name cannot be blank.",
          duplicate: "A category with this name already exists.",
          missing: "This category no longer exists.",
          "in-use": "Move companies to another category first.",
          "last-category": "Keep at least one category."
        }
      }
    : {
        title: "管理分类",
        description: "分类会影响公司类型分组和公司卡片里的下拉选项。",
        newName: "新分类名称",
        add: "新增分类",
        close: "关闭",
        categoryName: (name: string) => `分类名称 ${name}`,
        save: (name: string) => `保存 ${name}`,
        moveUp: (name: string) => `上移 ${name}`,
        moveDown: (name: string) => `下移 ${name}`,
        delete: (name: string) => `删除 ${name}`,
        inUse: (count: number) => `先把 ${count} 家公司移到其他分类`,
        empty: "暂无公司",
        errors: {
          blank: "分类名称不能为空。",
          duplicate: "已经有同名分类。",
          missing: "这个分类已经不存在。",
          "in-use": "先把公司移到其他分类。",
          "last-category": "至少保留一个分类。"
        }
      };
}

export function CategoryManager({
  open,
  companyCategories,
  categoryUsage,
  onCreateCategory,
  onRenameCategory,
  onMoveCategory,
  onDeleteCategory,
  onClose
}: CategoryManagerProps) {
  const locale = resolveAppLocale();
  const copy = getCopy(locale);
  const sortedCategories = useMemo(
    () => [...companyCategories].sort((left, right) => left.order - right.order),
    [companyCategories]
  );
  const dialogRef = useRef<HTMLElement | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraftNames((current) =>
      Object.fromEntries(
        sortedCategories.map((category) => [category.id, current[category.id] ?? category.name])
      )
    );
  }, [sortedCategories]);

  useEffect(() => {
    if (!open) return;

    const previousActiveElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    dialogRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      if (previousActiveElement && document.contains(previousActiveElement)) {
        previousActiveElement.focus();
      }
    };
  }, [onClose, open]);

  if (!open) return null;

  function showResult(result: CategoryActionResult) {
    if (result.ok) {
      setError(null);
      return true;
    }

    setError(copy.errors[result.error]);
    return false;
  }

  return (
    <div className="category-manager__backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="category-manager"
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
        tabIndex={-1}
      >
        <div className="category-manager__header">
          <div>
            <h2>{copy.title}</h2>
            <p>{copy.description}</p>
          </div>
          <button className="button button--ghost" type="button" onClick={onClose}>
            {copy.close}
          </button>
        </div>

        <div className="category-manager__create">
          <label>
            <span>{copy.newName}</span>
            <input
              aria-label={copy.newName}
              className="field field--input"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
            />
          </label>
          <button
            className="button button--primary"
            type="button"
            onClick={() => {
              if (showResult(onCreateCategory(newCategoryName))) {
                setNewCategoryName("");
              }
            }}
          >
            {copy.add}
          </button>
        </div>

        {error ? (
          <p className="category-manager__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="category-manager__list">
          {sortedCategories.map((category, index) => {
            const usage = categoryUsage[category.id] ?? 0;
            const deleteDisabled = usage > 0 || sortedCategories.length <= 1;

            return (
              <div className="category-manager__row" key={category.id}>
                <input
                  aria-label={copy.categoryName(category.name)}
                  className="field field--input"
                  value={draftNames[category.id] ?? category.name}
                  onChange={(event) =>
                    setDraftNames((current) => ({ ...current, [category.id]: event.target.value }))
                  }
                />
                <span className="category-manager__usage">
                  {usage > 0 ? copy.inUse(usage) : copy.empty}
                </span>
                <div className="category-manager__actions">
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() => showResult(onRenameCategory(category.id, draftNames[category.id] ?? ""))}
                  >
                    {copy.save(category.name)}
                  </button>
                  <button
                    aria-label={copy.moveUp(category.name)}
                    className="button button--ghost"
                    disabled={index === 0}
                    type="button"
                    onClick={() => onMoveCategory(category.id, "up")}
                  >
                    ↑
                  </button>
                  <button
                    aria-label={copy.moveDown(category.name)}
                    className="button button--ghost"
                    disabled={index === sortedCategories.length - 1}
                    type="button"
                    onClick={() => onMoveCategory(category.id, "down")}
                  >
                    ↓
                  </button>
                  <button
                    aria-label={copy.delete(category.name)}
                    className="button button--ghost button--danger"
                    disabled={deleteDisabled}
                    type="button"
                    onClick={() => showResult(onDeleteCategory(category.id))}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
