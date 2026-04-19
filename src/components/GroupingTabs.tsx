import type { GroupingMode } from "../types/interview";

const OPTIONS: Array<{ value: GroupingMode; label: string; ariaLabel: string }> = [
  { value: "companyType", label: "公司类型", ariaLabel: "按公司类型分组" },
  { value: "stage", label: "流程阶段", ariaLabel: "按流程阶段分组" }
];

export function GroupingTabs({
  value,
  onChange
}: {
  value: GroupingMode;
  onChange: (value: GroupingMode) => void;
}) {
  return (
    <div className="group-tabs__shell">
      <span className="group-tabs__label">切换工作台视角</span>
      <div className="group-tabs" aria-label="分组切换">
        {OPTIONS.map((option) => (
          <button
            className="group-tabs__button"
            key={option.value}
            aria-label={option.ariaLabel}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
