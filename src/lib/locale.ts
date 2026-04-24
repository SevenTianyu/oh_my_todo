import type {
  CompanyType,
  GroupingMode,
  NegotiationStatus,
  RoundStatus
} from "../types/interview";

export type AppLocale = "zh-CN" | "en";

const COMPANY_TYPE_LABELS: Record<AppLocale, Record<CompanyType, string>> = {
  "zh-CN": {
    startup: "创业公司",
    "big-tech": "大厂"
  },
  en: {
    startup: "Startup",
    "big-tech": "Big Tech"
  }
};

const ROUND_STATUS_LABELS: Record<AppLocale, Record<RoundStatus, string>> = {
  "zh-CN": {
    pending: "待安排",
    scheduled: "已排期",
    completed: "已完成",
    "waiting-result": "等结果",
    closed: "已结束"
  },
  en: {
    pending: "Pending",
    scheduled: "Scheduled",
    completed: "Completed",
    "waiting-result": "Waiting",
    closed: "Closed"
  }
};

const TERMINAL_NEGOTIATION_STATUS_LABELS: Record<
  AppLocale,
  Record<Extract<NegotiationStatus, "accepted" | "declined" | "terminated">, string>
> = {
  "zh-CN": {
    accepted: "已接受",
    declined: "已拒绝",
    terminated: "已终止"
  },
  en: {
    accepted: "Accepted",
    declined: "Declined",
    terminated: "Terminated"
  }
};

const GROUP_LABELS: Record<AppLocale, Record<GroupingMode, Record<string, string>>> = {
  "zh-CN": {
    companyType: {
      startup: "创业公司",
      "big-tech": "大厂"
    },
    stage: {
      screening: "筛选中",
      interviewing: "面试中",
      negotiating: "谈薪中"
    }
  },
  en: {
    companyType: {
      startup: "Startups",
      "big-tech": "Big Tech"
    },
    stage: {
      screening: "Screening",
      interviewing: "Interviewing",
      negotiating: "Negotiating"
    }
  }
};

const CHINESE_CASH_FORMATTER = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 2
});

const ENGLISH_CASH_FORMATTER = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 2
});

export function resolveAppLocale(language?: string): AppLocale {
  const fallbackLanguage =
    typeof document !== "undefined" ? document.documentElement.lang : "";
  const normalizedLanguage = (language ?? fallbackLanguage).trim().toLowerCase();

  return normalizedLanguage.startsWith("en") ? "en" : "zh-CN";
}

export function getCompanyTypeLabel(locale: AppLocale, companyType: CompanyType) {
  return COMPANY_TYPE_LABELS[locale][companyType];
}

export function getRoundStatusLabel(locale: AppLocale, roundStatus: RoundStatus) {
  return ROUND_STATUS_LABELS[locale][roundStatus];
}

export function getTerminalNegotiationStatusLabel(
  locale: AppLocale,
  status: Extract<NegotiationStatus, "accepted" | "declined" | "terminated">
) {
  return TERMINAL_NEGOTIATION_STATUS_LABELS[locale][status];
}

export function getGroupLabel(locale: AppLocale, grouping: GroupingMode, key: string) {
  return GROUP_LABELS[locale][grouping][key] ?? key;
}

export function formatLocalizedCashDisplay(value: number | null, locale: AppLocale) {
  if (value === null) {
    return locale === "en" ? "TBD" : "待补充";
  }

  if (locale === "en") {
    return `CNY ${ENGLISH_CASH_FORMATTER.format(value)}`;
  }

  return `${CHINESE_CASH_FORMATTER.format(value / 10000)} 万`;
}

export function formatLocalizedCashWithMonths(
  value: number | null,
  months: number | null,
  locale: AppLocale
) {
  if (value === null || months === null) {
    return locale === "en" ? "TBD" : "待补充";
  }

  if (locale === "en") {
    return `${formatLocalizedCashDisplay(value, locale)} × ${months} months`;
  }

  return `${formatLocalizedCashDisplay(value, locale)} × ${months} 薪`;
}
