const BEIJING_UTC_OFFSET_MS = 8 * 60 * 60 * 1000;
const EXPLICIT_TIME_ZONE_PATTERN = /(Z|[+-]\d{2}:?\d{2})$/i;
const LOCAL_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;

export function parseInterviewDateTime(value: string) {
  if (EXPLICIT_TIME_ZONE_PATTERN.test(value)) {
    return new Date(value);
  }

  const match = value.match(LOCAL_DATE_TIME_PATTERN);
  if (!match) {
    return new Date(value);
  }

  const [, year, month, day, hour, minute, second = "0", millisecond = "0"] = match;
  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour) - 8,
      Number(minute),
      Number(second),
      Number(millisecond.padEnd(3, "0"))
    )
  );
}

export function getBeijingEndOfNextSevenDays(now: Date) {
  const beijingDate = new Date(now.getTime() + BEIJING_UTC_OFFSET_MS);

  return new Date(
    Date.UTC(
      beijingDate.getUTCFullYear(),
      beijingDate.getUTCMonth(),
      beijingDate.getUTCDate() + 7,
      15,
      59,
      59,
      999
    )
  );
}
