import { useState } from "react";
import type { FormEvent } from "react";
import type { ActiveStage, CompanyType, NewCompanyDraft } from "../types/interview";

const COMPANY_TYPE_OPTIONS: Array<{ value: CompanyType; label: string }> = [
  { value: "startup", label: "创业公司" },
  { value: "big-tech", label: "大厂" }
];

const STAGE_OPTIONS: Array<{ value: ActiveStage; label: string }> = [
  { value: "screening", label: "筛选中" },
  { value: "interviewing", label: "面试中" },
  { value: "offer", label: "Offer 阶段" }
];

function createInitialDraft(): NewCompanyDraft {
  return {
    companyName: "",
    companyType: "startup",
    roleName: "",
    stage: "screening"
  };
}

interface NewCompanyFormProps {
  onSubmit: (draft: NewCompanyDraft) => void;
  onCancel?: () => void;
}

export function NewCompanyForm({ onSubmit, onCancel }: NewCompanyFormProps) {
  const [draft, setDraft] = useState<NewCompanyDraft>(() => createInitialDraft());

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
          <p className="panel__eyebrow">Quick Capture</p>
          <h2>新建公司与首个流程</h2>
        </div>
        <p className="panel__description">先录入最少字段，系统会按阶段自动补首轮，后续再补充判断、时间和备注。</p>
      </div>

      <form className="composer-form" onSubmit={handleSubmit}>
        <label className="composer-field">
          <span>公司名称</span>
          <input
            aria-label="公司名称"
            className="field composer-field__control"
            required
            type="text"
            value={draft.companyName}
            onChange={(event) => updateDraft("companyName", event.target.value)}
          />
        </label>

        <label className="composer-field">
          <span>公司类型</span>
          <select
            aria-label="公司类型"
            className="field composer-field__control"
            value={draft.companyType}
            onChange={(event) => updateDraft("companyType", event.target.value as CompanyType)}
          >
            {COMPANY_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="composer-field">
          <span>岗位名称</span>
          <input
            aria-label="岗位名称"
            className="field composer-field__control"
            required
            type="text"
            value={draft.roleName}
            onChange={(event) => updateDraft("roleName", event.target.value)}
          />
        </label>

        <label className="composer-field">
          <span>流程阶段</span>
          <select
            aria-label="流程阶段"
            className="field composer-field__control"
            value={draft.stage}
            onChange={(event) => updateDraft("stage", event.target.value as ActiveStage)}
          >
            {STAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="composer-form__actions">
          <button className="button button--primary" type="submit">
            保存到工作台
          </button>
          {onCancel ? (
            <button className="button button--ghost" type="button" onClick={onCancel}>
              取消
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
