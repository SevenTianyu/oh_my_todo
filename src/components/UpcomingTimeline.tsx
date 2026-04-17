import type { UpcomingInterview } from "../types/interview";

export function UpcomingTimeline({ interviews }: { interviews: UpcomingInterview[] }) {
  return (
    <section className="panel" aria-labelledby="upcoming-title">
      <h2 id="upcoming-title">未来 7 天面试</h2>
      <div className="timeline-list">
        {interviews.map((interview) => (
          <article className="timeline-item" key={interview.roundId}>
            <strong>{interview.companyName}</strong>
            <div>{interview.roundName}</div>
            <div>{new Date(interview.scheduledAt).toLocaleString("zh-CN")}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
