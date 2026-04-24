import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import "./styles/app.css";
import { ArchiveSection } from "./components/ArchiveSection";
import { CompanyBoard } from "./components/CompanyBoard";
import { GroupingTabs } from "./components/GroupingTabs";
import { NewCompanyForm } from "./components/NewCompanyForm";
import { OfferComparisonPanel } from "./components/OfferComparisonPanel";
import { UpcomingTimeline } from "./components/UpcomingTimeline";
import { useInterviewWorkbench } from "./hooks/useInterviewWorkbench";
import { getGroupLabel, resolveAppLocale, type AppLocale } from "./lib/locale";
import { getWorkbenchExportFilename, serializeWorkbenchSnapshot } from "./lib/storage";

type NoticeTone = "neutral" | "success" | "error";
const APP_LOCALE_STORAGE_KEY = "oh-my-todo.locale";

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

function resolveInitialLocale() {
  if (typeof window !== "undefined") {
    const storedLocale = window.localStorage.getItem(APP_LOCALE_STORAGE_KEY);
    if (storedLocale) {
      return resolveAppLocale(storedLocale);
    }
  }

  return resolveAppLocale();
}

export default function App() {
  const [locale, setLocale] = useState<AppLocale>(() => {
    const initialLocale = resolveInitialLocale();

    if (typeof document !== "undefined") {
      document.documentElement.lang = initialLocale;
    }

    return initialLocale;
  });
  const workbench = useInterviewWorkbench();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const copy =
    locale === "en"
      ? {
          documentTitle: "Interview Workbench",
          mastheadLabel: "Workbench Home",
          mastheadTitle: "Interview Workbench",
          mastheadLede: "Keep timing, judgment, and negotiation on one personal desk.",
          mastheadStatus: "Local-first / No login / Portable JSON",
          newFirstCompany: "Create First Company",
          newCompany: "New Company",
          exportData: "Export Data",
          importJson: "Import JSON",
          importInputAria: "Import workbench JSON",
          languageSwitcherLabel: "Language switcher",
          languageLabel: "Interface",
          chinese: "中",
          english: "EN",
          privacyNote:
            "Data stays in this browser by default; reloading keeps it, while clearing storage or switching browsers or devices will not sync it automatically.",
          overviewLabel: "Desk Overview",
          scheduledInterviews: "Scheduled Interviews",
          next7Days: "Next 7 Days",
          activeDossiers: "Active Dossiers",
          inProgress: "In Progress",
          archiveRecords: "Archive Records",
          history: "History",
          clearLocalData: "Clear Local Data",
          clearConfirm:
            "This will clear the local workbench data stored in this browser. Continue?",
          exportedNotice: "Exported the current local data.",
          importSuccessNotice: "Import succeeded. The local data in this browser has been replaced.",
          clearedNotice: "Cleared the local data stored in this browser.",
          createdNotice: "Saved in this browser.",
          emptyEyebrow: "Title Page",
          emptyTitle: "Start the desk with the first company",
          emptyDescription:
            "Write the company first, then add timing, judgment, and negotiation as the process becomes real.",
          boardEyebrow: "Active Pipeline",
          boardDescription:
            "Switch group views on one page and maintain company judgment, round timing, negotiation versions, and final comparison without splitting them across calendar, todo, and notes.",
          archiveEyebrow: (count: number) => `Archive (${count})`,
          archiveDescription:
            "The main workspace keeps only active work. Companies whose work has ended or been paused are stored here for later reference."
        }
      : {
          documentTitle: "面试工作台",
          mastheadLabel: "工作台首页",
          mastheadTitle: "面试工作台",
          mastheadLede: "把时间、判断和谈薪记录留在同一张个人工作台上。",
          mastheadStatus: "本地优先 / 无登录 / 可导入导出",
          newFirstCompany: "新建第一个公司",
          newCompany: "新建公司",
          exportData: "导出数据",
          importJson: "导入数据",
          importInputAria: "导入工作台数据",
          languageSwitcherLabel: "语言切换",
          languageLabel: "界面语言",
          chinese: "中",
          english: "EN",
          privacyNote:
            "数据默认只保存在当前浏览器；刷新页面不会丢，清缓存、换浏览器或换设备不会自动同步。",
          overviewLabel: "工作台概览",
          scheduledInterviews: "已定面试",
          next7Days: "未来 7 天",
          activeDossiers: "活跃判断",
          inProgress: "正在推进",
          archiveRecords: "归档记录",
          history: "历史判断",
          clearLocalData: "清空本地数据",
          clearConfirm: "这会清空当前浏览器中的本地工作台数据，是否继续？",
          exportedNotice: "已导出当前本地数据。",
          importSuccessNotice: "导入成功，当前本地数据已替换。",
          clearedNotice: "已清空当前浏览器中的本地数据。",
          createdNotice: "已保存到当前浏览器。",
          emptyEyebrow: "扉页",
          emptyTitle: "从第一家公司开始建立判断台",
          emptyDescription: "先写下公司，再逐步补上时间、判断和谈薪记录。",
          boardEyebrow: "活跃流程工作区",
          boardDescription:
            "在同一页切换分组视角，直接维护公司判断、轮次时间、谈薪版本与最终对比，不再拆散到日历、待办和笔记里。",
          archiveEyebrow: (count: number) => `归档（${count}）`,
          archiveDescription:
            "主工作区只保留活跃流程，已结束与搁置的公司统一存下来，保留后续回看依据。"
        };
  const groupedCompanies = workbench.groupedCompanies.map((group) => ({
    ...group,
    label: getGroupLabel(locale, workbench.grouping, group.key)
  }));
  const activeCompanyCount = new Set(
    groupedCompanies.flatMap((group) => group.companies.map((company) => company.id))
  ).size;
  const isEmpty = workbench.companies.length === 0;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = copy.documentTitle;

    if (typeof window !== "undefined") {
      window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, locale);
    }
  }, [copy.documentTitle, locale]);

  function handleLocaleChange(nextLocale: AppLocale) {
    if (nextLocale === locale) {
      return;
    }

    document.documentElement.lang = nextLocale;
    setLocale(nextLocale);
  }

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
      message: copy.exportedNotice
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
        message: copy.importSuccessNotice
      });
      return;
    }

    setNotice({
      tone: "error",
      message: result.error.message
    });
  }

  function handleClear() {
    if (!window.confirm(copy.clearConfirm)) {
      return;
    }

    workbench.resetWorkbench();
    setShowComposer(false);
    setNotice({
      tone: "neutral",
      message: copy.clearedNotice
    });
  }

  return (
    <main className="page">
      <header className="page__masthead" aria-label={copy.mastheadLabel}>
        <div className="page__masthead-copy">
          <h1>{copy.mastheadTitle}</h1>
          <p className="page__lede">{copy.mastheadLede}</p>
          <p className="page__status-strip">{copy.mastheadStatus}</p>

          <div className="page__masthead-toolbar">
            <div className="page__language-switcher" role="group" aria-label={copy.languageSwitcherLabel}>
              <span className="page__language-label">{copy.languageLabel}</span>
              <div className="page__language-buttons">
                <button
                  className={`button ${
                    locale === "zh-CN" ? "button--secondary" : "button--ghost"
                  } page__language-button`}
                  type="button"
                  aria-pressed={locale === "zh-CN"}
                  onClick={() => handleLocaleChange("zh-CN")}
                >
                  {copy.chinese}
                </button>
                <button
                  className={`button ${
                    locale === "en" ? "button--secondary" : "button--ghost"
                  } page__language-button`}
                  type="button"
                  aria-pressed={locale === "en"}
                  onClick={() => handleLocaleChange("en")}
                >
                  {copy.english}
                </button>
              </div>
            </div>

            <div className="page__masthead-actions">
              <button className="button button--primary" type="button" onClick={handleCreateCompany}>
                {isEmpty ? copy.newFirstCompany : copy.newCompany}
              </button>
              <button
                className="button button--secondary"
                type="button"
                onClick={handleExport}
                disabled={isEmpty}
              >
                {copy.exportData}
              </button>
              <button className="button button--ghost" type="button" onClick={openImportPicker}>
                {copy.importJson}
              </button>
              <input
                ref={fileInputRef}
                aria-label={copy.importInputAria}
                className="sr-only"
                type="file"
                accept="application/json,.json"
                onChange={handleImport}
              />
            </div>
          </div>

          <p className="page__privacy-note">
            {copy.privacyNote}
          </p>
          {notice ? (
            <p className={`page__notice page__notice--${notice.tone}`} role="status">
              {notice.message}
            </p>
          ) : null}
        </div>

        <aside className="page__masthead-rail" aria-label={copy.overviewLabel}>
          <div className="page__rail-card">
            <span>{copy.scheduledInterviews}</span>
            <strong>{workbench.upcomingInterviews.length}</strong>
            <small>{copy.next7Days}</small>
          </div>
          <div className="page__rail-card">
            <span>{copy.activeDossiers}</span>
            <strong>{activeCompanyCount}</strong>
            <small>{copy.inProgress}</small>
          </div>
          <div className="page__rail-card">
            <span>{copy.archiveRecords}</span>
            <strong>{workbench.archivedCompanies.length}</strong>
            <small>{copy.history}</small>
          </div>
          <button
            className="button button--ghost button--danger page__clear-button"
            type="button"
            onClick={handleClear}
            disabled={isEmpty}
          >
            {copy.clearLocalData}
          </button>
        </aside>
      </header>

      {showComposer ? (
        <section className="stack-section">
          <NewCompanyForm
            companyCategories={workbench.companyCategories}
            onSubmit={(draft) => {
              workbench.createCompanyWithProcess(draft);
              setShowComposer(false);
              setNotice({
                tone: "success",
                message: copy.createdNotice
              });
            }}
            onCancel={isEmpty ? undefined : () => setShowComposer(false)}
          />
        </section>
      ) : null}

      {isEmpty ? (
        <section className="stack-section">
          <section className="panel empty-state">
            <p className="panel__eyebrow">{copy.emptyEyebrow}</p>
            <h2>{copy.emptyTitle}</h2>
            <p className="panel__description">{copy.emptyDescription}</p>
            <div className="empty-state__actions">
              <button className="button button--primary" type="button" onClick={handleCreateCompany}>
                {copy.newFirstCompany}
              </button>
              <button className="button button--ghost" type="button" onClick={openImportPicker}>
                {copy.importJson}
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
                <p className="section-heading__eyebrow">{copy.boardEyebrow}</p>
              </div>
              <p className="section-heading__description">
                {copy.boardDescription}
              </p>
            </div>
            <GroupingTabs value={workbench.grouping} onChange={workbench.setGrouping} />
            <CompanyBoard
              groups={groupedCompanies}
              companyCategories={workbench.companyCategories}
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
                <p className="section-heading__eyebrow">
                  {copy.archiveEyebrow(workbench.archivedCompanies.length)}
                </p>
              </div>
              <p className="section-heading__description">
                {copy.archiveDescription}
              </p>
            </div>
            <ArchiveSection companies={workbench.archivedCompanies} />
          </section>
        </>
      )}
    </main>
  );
}
