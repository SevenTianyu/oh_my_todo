import type { GroupingMode } from "../types/interview";
import { resolveAppLocale } from "../lib/locale";

export function GroupingTabs({
  value,
  onChange
}: {
  value: GroupingMode;
  onChange: (value: GroupingMode) => void;
}) {
  const locale = resolveAppLocale();
  const copy =
    locale === "en"
      ? {
          label: "Workbench Index",
          groupSwitcherAria: "Grouping switcher",
          options: [
            { value: "companyType" as const, label: "Company Type", ariaLabel: "Group by company type" },
            { value: "stage" as const, label: "Stage", ariaLabel: "Group by stage" }
          ]
        }
      : {
          label: "工作台索引",
          groupSwitcherAria: "分组切换",
          options: [
            { value: "companyType" as const, label: "公司类型", ariaLabel: "按公司类型分组" },
            { value: "stage" as const, label: "流程阶段", ariaLabel: "按流程阶段分组" }
          ]
        };

  return (
    <div className="group-tabs__shell">
      <span className="group-tabs__label">{copy.label}</span>
      <div className="group-tabs" aria-label={copy.groupSwitcherAria}>
        {copy.options.map((option, index) => (
          <button
            className="group-tabs__button"
            key={option.value}
            aria-label={option.ariaLabel}
            aria-pressed={value === option.value}
            type="button"
            onClick={() => onChange(option.value)}
          >
            <span className="group-tabs__index">{String(index + 1).padStart(2, "0")}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
