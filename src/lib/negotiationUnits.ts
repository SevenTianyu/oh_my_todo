const CASH_UNIT_DIVISOR = 10000;

const cashDisplayFormatter = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 2
});

function trimTrailingZeros(value: string) {
  return value.replace(/(?:\.0+|(\.\d+?)0+)$/, "$1");
}

export function parseCashInputToYuan(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.round(parsed * CASH_UNIT_DIVISOR);
}

export function formatCashInputFromYuan(value: number | null) {
  if (value === null) {
    return "";
  }

  return trimTrailingZeros((value / CASH_UNIT_DIVISOR).toFixed(2));
}

export function formatCashDisplayInWan(value: number | null) {
  if (value === null) {
    return "待补充";
  }

  return `${cashDisplayFormatter.format(value / CASH_UNIT_DIVISOR)} 万`;
}
