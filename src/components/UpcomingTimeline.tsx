import type { UpcomingInterview } from "../types/interview";
import { resolveAppLocale } from "../lib/locale";

function getFallbackAgendaParts(locale: "zh-CN" | "en") {
  return {
    dayLabel: "--/--",
    weekdayLabel: locale === "en" ? "Unknown" : "未知",
    timeLabel: "--:--"
  };
}

const FORMATTERS = {
  "zh-CN": {
    day: new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }),
    weekday: new Intl.DateTimeFormat("zh-CN", { weekday: "short" }),
    time: new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    })
  },
  en: {
    day: new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }),
    weekday: new Intl.DateTimeFormat("en", { weekday: "short" }),
    time: new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    })
  }
} as const;

function formatAgendaParts(value: string, locale: "zh-CN" | "en") {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return getFallbackAgendaParts(locale);
  }

  const formatter = FORMATTERS[locale];
  return {
    dayLabel: formatter.day.format(date),
    weekdayLabel: formatter.weekday.format(date),
    timeLabel: formatter.time.format(date)
  };
}

export function UpcomingTimeline({ interviews }: { interviews: UpcomingInterview[] }) {
  const locale = resolveAppLocale();
  const copy =
    locale === "en"
      ? {
          eyebrow: "Next 7 Days",
          description:
            "See the interviews that are already fixed on the calendar before deciding today's momentum.",
          empty: "Nothing scheduled in the next 7 days yet."
        }
      : {
          eyebrow: "未来 7 天安排",
          description: "先看已经落定的时间，再决定今天的推进顺序。",
          empty: "未来 7 天还没有已定安排。"
        };

  return (
    <section className="panel panel--agenda" aria-labelledby="upcoming-title">
      <div className="panel__header panel__header--agenda">
        <div>
          <p className="panel__eyebrow" id="upcoming-title">
            {copy.eyebrow}
          </p>
        </div>
        <p className="panel__description">{copy.description}</p>
      </div>
      <div className="agenda-list">
        {interviews.length > 0 ? (
          interviews.map((interview) => {
            const { dayLabel, weekdayLabel, timeLabel } = formatAgendaParts(interview.scheduledAt, locale);

            return (
              <article className="agenda-item" key={interview.roundId}>
                <div className="agenda-item__date">
                  <strong>{dayLabel}</strong>
                  <span>{weekdayLabel}</span>
                </div>
                <div className="agenda-item__body">
                  <div className="agenda-item__meta">
                    <span>{interview.companyName}</span>
                    <span>{interview.roleName}</span>
                  </div>
                  <strong className="agenda-item__title">{interview.roundName}</strong>
                </div>
                <div className="agenda-item__time">{timeLabel}</div>
              </article>
            );
          })
        ) : (
          <div className="timeline-empty">{copy.empty}</div>
        )}
      </div>
    </section>
  );
}
