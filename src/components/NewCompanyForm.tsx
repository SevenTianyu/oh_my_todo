import { useEffect, useId, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { resolveAppLocale } from "../lib/locale";
import type { CompanyCategory, NewCompanyDraft } from "../types/interview";

function getInitialCategoryId(companyCategories: CompanyCategory[]) {
  return [...companyCategories].sort((left, right) => left.order - right.order)[0]?.id ?? "";
}

function createInitialDraft(companyCategories: CompanyCategory[]): NewCompanyDraft {
  return {
    companyName: "",
    companyType: getInitialCategoryId(companyCategories),
    roleName: ""
  };
}

interface NewCompanyFormProps {
  companyCategories: CompanyCategory[];
  onManageCategories?: () => void;
  onSubmit: (draft: NewCompanyDraft) => void;
  onCancel?: () => void;
}

export function NewCompanyForm({
  companyCategories,
  onManageCategories,
  onSubmit,
  onCancel
}: NewCompanyFormProps) {
  const locale = resolveAppLocale();
  const companyTypeId = useId();
  const sortedCompanyCategories = useMemo(
    () =>
      [...companyCategories].sort(
        (left, right) => left.order - right.order || left.name.localeCompare(right.name)
      ),
    [companyCategories]
  );
  const [draft, setDraft] = useState<NewCompanyDraft>(() =>
    createInitialDraft(sortedCompanyCategories)
  );
  const copy =
    locale === "en"
      ? {
          eyebrow: "Quick Capture",
          title: "Write the first dossier",
          description: "Capture the minimum now, then add the real context later.",
          companyName: "Company Name",
          companyType: "Company Type",
          roleName: "Role Name",
          manageCategories: "Manage Categories",
          save: "Save to Workbench",
          cancel: "Cancel"
        }
      : {
          eyebrow: "快速录入",
          title: "写下第一条新判断",
          description: "只填最少字段，后面再补充真实上下文。",
          companyName: "公司名称",
          companyType: "公司类型",
          roleName: "岗位名称",
          manageCategories: "管理分类",
          save: "保存到工作台",
          cancel: "取消"
        };

  useEffect(() => {
    setDraft((current) =>
      sortedCompanyCategories.some((category) => category.id === current.companyType)
        ? current
        : { ...current, companyType: getInitialCategoryId(sortedCompanyCategories) }
    );
  }, [sortedCompanyCategories]);

  function updateDraft<K extends keyof NewCompanyDraft>(key: K, value: NewCompanyDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedDraft: NewCompanyDraft = {
      ...draft,
      companyName: draft.companyName.trim(),
      roleName: draft.roleName.trim()
    };

    if (!normalizedDraft.companyName || !normalizedDraft.roleName) {
      return;
    }

    onSubmit(normalizedDraft);
    setDraft(createInitialDraft(sortedCompanyCategories));
  }

  return (
    <section className="panel composer-panel">
      <div className="composer-panel__header">
        <div>
          <p className="panel__eyebrow">{copy.eyebrow}</p>
          <h2>{copy.title}</h2>
        </div>
        <p className="panel__description">{copy.description}</p>
      </div>

      <form className="composer-form" onSubmit={handleSubmit}>
        <label className="composer-field">
          <span>{copy.companyName}</span>
          <input
            aria-label={copy.companyName}
            className="field composer-field__control"
            required
            type="text"
            value={draft.companyName}
            onChange={(event) => updateDraft("companyName", event.target.value)}
          />
        </label>

        <div className="composer-field">
          <div className="composer-field__label-row">
            <label htmlFor={companyTypeId}>{copy.companyType}</label>
            {onManageCategories ? (
              <button
                className="button button--ghost composer-field__manage-button"
                type="button"
                onClick={onManageCategories}
              >
                {copy.manageCategories}
              </button>
            ) : null}
          </div>
          <select
            aria-label={copy.companyType}
            className="field composer-field__control"
            id={companyTypeId}
            value={draft.companyType}
            onChange={(event) => updateDraft("companyType", event.target.value)}
          >
            {sortedCompanyCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <label className="composer-field">
          <span>{copy.roleName}</span>
          <input
            aria-label={copy.roleName}
            className="field composer-field__control"
            required
            type="text"
            value={draft.roleName}
            onChange={(event) => updateDraft("roleName", event.target.value)}
          />
        </label>

        <div className="composer-form__actions">
          <button className="button button--primary" type="submit">
            {copy.save}
          </button>
          {onCancel ? (
            <button className="button button--ghost" type="button" onClick={onCancel}>
              {copy.cancel}
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
