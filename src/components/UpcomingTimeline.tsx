import type { UpcomingInterview } from "../types/interview";

function formatAgendaParts(value: string) {
  const [datePart, timePart = "00:00"] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour = "00", minute = "00"] = timePart.split(/[:+-]/);
  const date = new Date(year, month - 1, day);

  return {
    dayLabel: new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(date),
    weekdayLabel: new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(date),
    timeLabel: `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`
  };
}

export function UpcomingTimeline({ interviews }: { interviews: UpcomingInterview[] }) {
  return (
    <section className="panel panel--agenda" aria-labelledby="upcoming-title">
      <div className="panel__header panel__header--agenda">
        <div>
          <p className="panel__eyebrow">Agenda</p>
          <h2 id="upcoming-title">未来 7 天安排</h2>
        </div>
        <p className="panel__description">先看已经落定的时间，再决定今天的推进顺序。</p>
      </div>
      <div className="agenda-list">
        {interviews.length > 0 ? (
          interviews.map((interview) => {
            const { dayLabel, weekdayLabel, timeLabel } = formatAgendaParts(interview.scheduledAt);

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
          <div className="timeline-empty">未来 7 天还没有已定安排。</div>
        )}
      </div>
    </section>
  );
}
