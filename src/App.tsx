import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import "./styles/app.css";
import { ArchiveSection } from "./components/ArchiveSection";
import { CompanyBoard } from "./components/CompanyBoard";
import { GroupingTabs } from "./components/GroupingTabs";
import { NewCompanyForm } from "./components/NewCompanyForm";
import { OfferComparisonPanel } from "./components/OfferComparisonPanel";
import { UpcomingTimeline } from "./components/UpcomingTimeline";
import { useInterviewWorkbench } from "./hooks/useInterviewWorkbench";
import { getWorkbenchExportFilename, serializeWorkbenchSnapshot } from "./lib/storage";

type NoticeTone = "neutral" | "success" | "error";

function readFileAsText(file: File) {
  if (typeof file.text === "function") {
    return file.text();
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read import file"));
    reader.readAsText(file);
  });
}

export default function App() {
  const workbench = useInterviewWorkbench();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const activeCompanyCount = new Set(
    workbench.groupedCompanies.flatMap((group) => group.companies.map((company) => company.id))
  ).size;
  const isEmpty = workbench.companies.length === 0;

  function openImportPicker() {
    fileInputRef.current?.click();
  }

  function handleCreateCompany() {
    setShowComposer(true);
    setNotice(null);
  }

  function handleExport() {
    const blob = new Blob([serializeWorkbenchSnapshot(workbench.snapshot)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = getWorkbenchExportFilename();
    link.click();
    URL.revokeObjectURL(url);
    setNotice({
      tone: "success",
      message: "已导出当前本地数据。"
    });
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const result = workbench.importWorkbenchSnapshot(await readFileAsText(file));

    if (result.ok) {
      setShowComposer(false);
      setNotice({
        tone: "success",
        message: "导入成功，当前本地数据已替换。"
      });
      return;
    }

    setNotice({
      tone: "error",
      message: result.error.message
    });
  }

  function handleClear() {
    if (!window.confirm("这会清空当前浏览器中的本地工作台数据，是否继续？")) {
      return;
    }

    workbench.resetWorkbench();
    setShowComposer(false);
    setNotice({
      tone: "neutral",
      message: "已清空当前浏览器中的本地数据。"
    });
  }

  return (
    <main className="page">
      <header className="page__masthead" aria-label="工作台首页">
        <div className="page__masthead-copy">
          <p className="page__kicker">Private Interview Desk</p>
          <h1>面试工作台</h1>
          <p className="page__lede">把时间、判断和谈薪记录留在同一张私人工作台上。</p>
          <p className="page__status-strip">本地优先 / 无登录 / JSON 可迁移</p>

          <div className="page__masthead-actions">
            <button className="button button--primary" type="button" onClick={handleCreateCompany}>
              {isEmpty ? "新建第一个公司" : "新建公司"}
            </button>
            <button
              className="button button--secondary"
              type="button"
              onClick={handleExport}
              disabled={isEmpty}
            >
              导出数据
            </button>
            <button className="button button--ghost" type="button" onClick={openImportPicker}>
              导入 JSON
            </button>
            <input
              ref={fileInputRef}
              aria-label="导入工作台 JSON"
              className="sr-only"
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
            />
          </div>

          <p className="page__privacy-note">
            数据默认只保存在当前浏览器；刷新页面不会丢，清缓存、换浏览器或换设备不会自动同步。
          </p>
          {notice ? (
            <p className={`page__notice page__notice--${notice.tone}`} role="status">
              {notice.message}
            </p>
          ) : null}
        </div>

        <aside className="page__masthead-rail" aria-label="工作台概览">
          <div className="page__rail-card">
            <span>已定面试</span>
            <strong>{workbench.upcomingInterviews.length}</strong>
            <small>未来 7 天</small>
          </div>
          <div className="page__rail-card">
            <span>活跃判断</span>
            <strong>{activeCompanyCount}</strong>
            <small>正在推进</small>
          </div>
          <div className="page__rail-card">
            <span>归档记录</span>
            <strong>{workbench.archivedCompanies.length}</strong>
            <small>历史判断</small>
          </div>
          <button
            className="button button--ghost button--danger page__clear-button"
            type="button"
            onClick={handleClear}
            disabled={isEmpty}
          >
            清空本地数据
          </button>
        </aside>
      </header>

      {showComposer ? (
        <section className="stack-section">
          <NewCompanyForm
            onSubmit={(draft) => {
              workbench.createCompanyWithProcess(draft);
              setShowComposer(false);
              setNotice({
                tone: "success",
                message: "已保存到当前浏览器。"
              });
            }}
            onCancel={isEmpty ? undefined : () => setShowComposer(false)}
          />
        </section>
      ) : null}

      {isEmpty ? (
        <section className="stack-section">
          <section className="panel empty-state">
            <p className="panel__eyebrow">Local-First Setup</p>
            <h2>你的面试工作台还是空的</h2>
            <p className="panel__description">
              先手动录入第一个公司，或者直接导入你已经整理好的 JSON 快照。没有登录，没有云端存档，默认只保存在这台设备的当前浏览器里。
            </p>
            <div className="empty-state__actions">
              <button className="button button--primary" type="button" onClick={handleCreateCompany}>
                新建第一个公司
              </button>
              <button className="button button--secondary" type="button" onClick={openImportPicker}>
                导入 JSON
              </button>
            </div>
          </section>
        </section>
      ) : (
        <>
          <UpcomingTimeline interviews={workbench.upcomingInterviews} />

          <section className="stack-section stack-section--board">
            <div className="section-heading">
              <div>
                <p className="section-heading__eyebrow">Pipeline Workspace</p>
                <h2>活跃流程工作区</h2>
              </div>
              <p className="section-heading__description">
                在同一页切换分组视角，直接维护公司判断、轮次时间、谈薪版本与最终对比，不再拆散到日历、待办和笔记里。
              </p>
            </div>
            <GroupingTabs value={workbench.grouping} onChange={workbench.setGrouping} />
            <CompanyBoard
              groups={workbench.groupedCompanies}
              onSaveSummary={workbench.updateCompanySummary}
              onAddRound={workbench.addRoundToProcess}
              negotiationSuggestionProcessIds={workbench.negotiationSuggestionProcessIds}
              onStartNegotiation={workbench.startNegotiation}
              onSaveNegotiationSnapshot={workbench.saveNegotiationSnapshot}
              onDeleteNegotiationSnapshot={workbench.deleteNegotiationSnapshot}
              onFinishNegotiation={workbench.finishNegotiation}
              onArchiveProcess={workbench.archiveProcessById}
              onUpdateProcess={workbench.updateProcessRecord}
              onUpdateRound={workbench.updateRoundRecord}
            />
          </section>

          <section className="stack-section">
            <OfferComparisonPanel
              rows={workbench.offerComparisonRows}
              scope={workbench.comparisonScope}
              onScopeChange={workbench.setComparisonScope}
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
        </>
      )}
    </main>
  );
}
