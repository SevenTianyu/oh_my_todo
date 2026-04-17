import type { UpcomingInterview } from "../types/interview";

export function UpcomingTimeline({ interviews }: { interviews: UpcomingInterview[] }) {
  return (
    <section className="panel panel--timeline" aria-labelledby="upcoming-title">
      <div className="panel__header panel__header--timeline">
        <div>
          <p className="panel__eyebrow">Next 7 Days</p>
          <h2 id="upcoming-title">未来 7 天面试</h2>
        </div>
        <p className="panel__description">这里只放已经定下时间的面试，打开页面先看这一块。</p>
      </div>
      <div className="timeline-list">
        {interviews.length > 0 ? (
          interviews.map((interview) => (
            <article className="timeline-item" key={interview.roundId}>
              <div className="timeline-item__meta">
                <span>{interview.companyName}</span>
                <span>{interview.roleName}</span>
              </div>
              <strong className="timeline-item__title">{interview.roundName}</strong>
              <div className="timeline-item__time">
                {new Date(interview.scheduledAt).toLocaleString("zh-CN", {
                  month: "numeric",
                  day: "numeric",
                  weekday: "short",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </div>
            </article>
          ))
        ) : (
          <div className="timeline-empty">未来 7 天还没有已定面试。</div>
        )}
      </div>
    </section>
  );
}
