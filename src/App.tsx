import "./styles/app.css";
import { ArchiveSection } from "./components/ArchiveSection";
import { CompanyBoard } from "./components/CompanyBoard";
import { GroupingTabs } from "./components/GroupingTabs";
import { UpcomingTimeline } from "./components/UpcomingTimeline";
import { useInterviewWorkbench } from "./hooks/useInterviewWorkbench";

export default function App() {
  const workbench = useInterviewWorkbench();
  const activeCompanyCount = new Set(
    workbench.groupedCompanies.flatMap((group) => group.companies.map((company) => company.id))
  ).size;

  return (
    <main className="page">
      <header className="page__hero">
        <div className="page__hero-panel">
          <div className="page__hero-copy">
            <p className="page__eyebrow">Interview Workbench</p>
            <h1>面试工作台</h1>
            <p className="page__intro">
              先看未来 7 天已定面试，再把仍在推进的公司流程和主观判断留在同一个桌面控制台里。
            </p>
          </div>

          <div className="page__hero-metrics" aria-label="工作台概览">
            <article className="page__hero-metric">
              <span>未来 7 天</span>
              <strong>{workbench.upcomingInterviews.length}</strong>
              <small>场已定面试</small>
            </article>
            <article className="page__hero-metric">
              <span>活跃公司</span>
              <strong>{activeCompanyCount}</strong>
              <small>个在推进中的判断对象</small>
            </article>
            <article className="page__hero-metric">
              <span>归档记录</span>
              <strong>{workbench.archivedCompanies.length}</strong>
              <small>个已结束或搁置流程</small>
            </article>
          </div>
        </div>
      </header>

      <UpcomingTimeline interviews={workbench.upcomingInterviews} />

      <section className="stack-section stack-section--board">
        <div className="section-heading">
          <div>
            <p className="section-heading__eyebrow">Pipeline Workspace</p>
            <h2>活跃流程工作区</h2>
          </div>
          <p className="section-heading__description">
            在同一页切换分组视角，直接维护公司判断、轮次时间和备注，不再拆散到日历、待办和笔记里。
          </p>
        </div>
        <GroupingTabs value={workbench.grouping} onChange={workbench.setGrouping} />
        <CompanyBoard
          groups={workbench.groupedCompanies}
          onSaveSummary={workbench.updateCompanySummary}
          onAddRound={workbench.addRoundToProcess}
          onArchiveProcess={workbench.archiveProcessById}
          onUpdateRound={workbench.updateRoundRecord}
        />
      </section>

      <section className="stack-section">
        <div className="section-heading section-heading--archive">
          <div>
            <p className="section-heading__eyebrow">Archive</p>
            <h2>历史判断区</h2>
          </div>
          <p className="section-heading__description">
            主工作区只保留活跃流程，已结束与搁置的公司统一沉到这里，保留后续回看依据。
          </p>
        </div>
        <ArchiveSection companies={workbench.archivedCompanies} />
      </section>
    </main>
  );
}
