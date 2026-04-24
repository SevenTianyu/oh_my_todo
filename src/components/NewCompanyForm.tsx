import { useState } from "react";
import type { FormEvent } from "react";
import { getCompanyTypeLabel, resolveAppLocale } from "../lib/locale";
import type { CompanyType, NewCompanyDraft } from "../types/interview";

function createInitialDraft(): NewCompanyDraft {
  return {
    companyName: "",
    companyType: "startup",
    roleName: ""
  };
}

interface NewCompanyFormProps {
  onSubmit: (draft: NewCompanyDraft) => void;
  onCancel?: () => void;
}

export function NewCompanyForm({ onSubmit, onCancel }: NewCompanyFormProps) {
  const locale = resolveAppLocale();
  const [draft, setDraft] = useState<NewCompanyDraft>(() => createInitialDraft());
  const copy =
    locale === "en"
      ? {
          eyebrow: "Quick Capture",
          title: "Write the first dossier",
          description: "Capture the minimum now, then add the real context later.",
          companyName: "Company Name",
          companyType: "Company Type",
          roleName: "Role Name",
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
          save: "保存到工作台",
          cancel: "取消"
        };
  const companyTypeOptions: Array<{ value: CompanyType; label: string }> = [
    { value: "startup", label: getCompanyTypeLabel(locale, "startup") },
    { value: "big-tech", label: getCompanyTypeLabel(locale, "big-tech") }
  ];

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
    setDraft(createInitialDraft());
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

        <label className="composer-field">
          <span>{copy.companyType}</span>
          <select
            aria-label={copy.companyType}
            className="field composer-field__control"
            value={draft.companyType}
            onChange={(event) => updateDraft("companyType", event.target.value as CompanyType)}
          >
            {companyTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

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
