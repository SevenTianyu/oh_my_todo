import "./styles/app.css";
import { ArchiveSection } from "./components/ArchiveSection";
import { CompanyBoard } from "./components/CompanyBoard";
import { GroupingTabs } from "./components/GroupingTabs";
import { UpcomingTimeline } from "./components/UpcomingTimeline";
import { useInterviewWorkbench } from "./hooks/useInterviewWorkbench";

export default function App() {
  const workbench = useInterviewWorkbench();

  return (
    <main className="page">
      <header>
        <h1>面试工作台</h1>
        <p>先看最近已定面试，再管理仍在推进的公司流程。</p>
      </header>

      <UpcomingTimeline interviews={workbench.upcomingInterviews} />

      <section className="stack-section">
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
        <ArchiveSection companies={workbench.archivedCompanies} />
      </section>
    </main>
  );
}
