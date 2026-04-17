import type { GroupingMode } from "../types/interview";

const OPTIONS: Array<{ value: GroupingMode; label: string; ariaLabel: string }> = [
  { value: "companyType", label: "公司类型", ariaLabel: "按公司类型分组" },
  { value: "stage", label: "流程阶段", ariaLabel: "按流程阶段分组" },
  { value: "priority", label: "个人优先级", ariaLabel: "按个人优先级分组" }
];

export function GroupingTabs({
  value,
  onChange
}: {
  value: GroupingMode;
  onChange: (value: GroupingMode) => void;
}) {
  return (
    <div className="group-tabs" role="tablist" aria-label="分组切换">
      {OPTIONS.map((option) => (
        <button
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
  );
}
