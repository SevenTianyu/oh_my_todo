import { useState } from "react";
import "./styles/app.css";
import { ArchiveSection } from "./components/ArchiveSection";
import { CompanyBoard } from "./components/CompanyBoard";
import { GroupingTabs } from "./components/GroupingTabs";
import { UpcomingTimeline } from "./components/UpcomingTimeline";
import { sampleCompanies } from "./lib/sampleData";
import { getArchivedCompanies, getGroupedCompanies, getUpcomingInterviews } from "./lib/selectors";
import type { GroupingMode } from "./types/interview";

export default function App() {
  const [grouping, setGrouping] = useState<GroupingMode>("companyType");

  return (
    <main className="page">
      <header>
        <h1>面试工作台</h1>
        <p>先看最近已定面试，再管理仍在推进的公司流程。</p>
      </header>

      <UpcomingTimeline
        interviews={getUpcomingInterviews(sampleCompanies, new Date("2026-04-17T09:00:00-07:00"))}
      />

      <section style={{ marginTop: 24 }}>
        <GroupingTabs value={grouping} onChange={setGrouping} />
        <CompanyBoard groups={getGroupedCompanies(sampleCompanies, grouping)} />
      </section>

      <section style={{ marginTop: 24 }}>
        <ArchiveSection companies={getArchivedCompanies(sampleCompanies)} />
      </section>
    </main>
  );
}
