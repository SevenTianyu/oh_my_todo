import { getLatestNegotiationSnapshot } from "../lib/compensation";
import {
  formatLocalizedCashWithMonths,
  getRoundStatusLabel,
  getTerminalNegotiationStatusLabel,
  resolveAppLocale,
  type AppLocale
} from "../lib/locale";
import type { CompanyRecord } from "../types/interview";

function getInterviewImpressionLines(company: CompanyRecord, locale: AppLocale) {
  return company.processes.flatMap((process) =>
    process.rounds.flatMap((round) => {
      const notes = round.notes.trim();
      if (!notes) return [];

      const scheduledDate = round.scheduledAt?.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
      const separator = locale === "en" ? ": " : "：";
      return [scheduledDate ? `${scheduledDate} ${round.name}${separator}${notes}` : `${round.name}${separator}${notes}`];
    })
  );
}

function getCompanyImpressionPreview(company: CompanyRecord, locale: AppLocale) {
  return [company.overallImpression.trim(), ...getInterviewImpressionLines(company, locale)]
    .filter(Boolean)
    .join("\n");
}

function formatArchiveSummary(company: CompanyRecord, locale: AppLocale, noArchiveNote: string) {
  const archivedProcesses = company.processes.filter((process) => process.status === "archived");
  const notes = archivedProcesses.flatMap((process) => {
    const archiveNote = process.archiveNote?.trim();
    if (!archiveNote) {
      return [];
    }

    return archivedProcesses.length > 1
      ? [locale === "en" ? `${process.roleName}: ${archiveNote}` : `${process.roleName}：${archiveNote}`]
      : [archiveNote];
  });

  return notes.join("\n") || company.overallImpression.trim() || noArchiveNote;
}

function formatArchiveDateTime(value: string, locale: AppLocale) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function ArchiveSection({ companies }: { companies: CompanyRecord[] }) {
  const locale = resolveAppLocale();
  const copy =
    locale === "en"
      ? {
          companyJudgmentTitle: "Company Judgment",
          overallJudgment: "Overall Judgment",
          archivedProcessesTitle: "Archived Processes",
          archiveNoteLabel: "Archive Note",
          noArchiveNote: "No archive note recorded.",
          result: "Negotiation Result",
          savedRecord: "Saved Negotiation Record",
          linkedRole: (roleName: string) => `Linked Role: ${roleName}`,
          history: (count: number) => `Negotiation History (${count})`,
          version: (version: number) => `Version ${version}`,
          hrSignal: (signal: string) => `HR Signal: ${signal}`,
          nextStep: (value: string) => `Next: ${value}`
        }
      : {
          companyJudgmentTitle: "公司判断",
          overallJudgment: "整体判断",
          archivedProcessesTitle: "历史流程",
          archiveNoteLabel: "归档说明",
          noArchiveNote: "暂无归档说明。",
          result: "谈薪结果",
          savedRecord: "已保存谈薪记录",
          linkedRole: (roleName: string) => `关联岗位：${roleName}`,
          history: (count: number) => `谈薪历史（${count}）`,
          version: (version: number) => `版本 ${version}`,
          hrSignal: (signal: string) => `招聘方反馈：${signal}`,
          nextStep: (value: string) => `下一步：${value}`
        };

  return (
    <section className="panel archive-panel">
      <div className="archive-panel__list">
        {companies.map((company) => {
          const latestSnapshot = getLatestNegotiationSnapshot(company.negotiation);
          const sourceProcess = company.processes.find(
            (process) => process.id === company.negotiation.sourceProcessId
          );
          const snapshots = [...company.negotiation.snapshots].sort(
            (left, right) => right.version - left.version
          );
          const archivedProcesses = company.processes.filter((process) => process.status === "archived");
          const terminalStatus =
            company.negotiation.status === "accepted" ||
            company.negotiation.status === "declined" ||
            company.negotiation.status === "terminated"
              ? company.negotiation.status
              : null;

          return (
            <details className="company-card company-card--archived" key={company.id}>
              <summary className="company-card__archive-summary">
                <div className="company-card__archive-summary-copy">
                  <strong className="company-card__name">{company.name}</strong>
                  <div className="company-card__archive-preview">
                    <span>{copy.archiveNoteLabel}</span>
                    <p>{formatArchiveSummary(company, locale, copy.noArchiveNote)}</p>
                  </div>
                </div>
              </summary>

              <div className="company-card__archive-body">
                <section className="company-card__section">
                  <div className="company-card__section-header">
                    <h4 className="company-card__section-title">{copy.companyJudgmentTitle}</h4>
                  </div>
                  <div className="company-card__summary-lines">
                    <div className="company-card__summary-item">
                      <span>{copy.overallJudgment}</span>
                      <p>{getCompanyImpressionPreview(company, locale)}</p>
                    </div>
                  </div>
                </section>

                <section className="company-card__section">
                  <div className="company-card__section-header">
                    <h4 className="company-card__section-title">{copy.archivedProcessesTitle}</h4>
                  </div>

                  {archivedProcesses.map((process) => (
                    <section className="company-card__process company-card__process--archived" key={process.id}>
                      <div className="company-card__process-header">
                        <div className="company-card__process-copy">
                          <h4 className="company-card__process-title">{process.roleName}</h4>
                          <div className="company-card__process-meta">
                            <span className="company-card__process-next">{copy.nextStep(process.nextStep)}</span>
                          </div>
                          {process.archiveNote ? (
                            <p className="company-card__archive-process-note">
                              {locale === "en"
                                ? `${copy.archiveNoteLabel}: ${process.archiveNote}`
                                : `${copy.archiveNoteLabel}：${process.archiveNote}`}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {process.rounds.map((round) => (
                        <article className="company-card__archive-round" key={round.id}>
                          <div className="company-card__round-heading">
                            <strong className="company-card__round-label">{round.name}</strong>
                            <span className={`badge badge--round badge--round-${round.status}`}>
                              {getRoundStatusLabel(locale, round.status)}
                            </span>
                          </div>
                          {round.scheduledAt ? (
                            <p className="company-card__archive-round-time">
                              {formatArchiveDateTime(round.scheduledAt, locale)}
                            </p>
                          ) : null}
                          {round.notes ? <p>{round.notes}</p> : null}
                        </article>
                      ))}
                    </section>
                  ))}
                </section>

                {latestSnapshot ? (
                  <section className="company-card__section">
                    <div className="company-card__section-header">
                      <h4 className="company-card__section-title">{copy.result}</h4>
                    </div>
                    <div className="company-card__negotiation">
                      <div className="company-card__negotiation-summary">
                        <div>
                          <span className="company-card__negotiation-eyebrow">{copy.result}</span>
                          <strong>
                            {terminalStatus
                              ? getTerminalNegotiationStatusLabel(locale, terminalStatus)
                              : copy.savedRecord}
                          </strong>
                        </div>
                        <p>{latestSnapshot.title}</p>
                        {sourceProcess ? <p>{copy.linkedRole(sourceProcess.roleName)}</p> : null}
                        <p>
                          {formatLocalizedCashWithMonths(
                            latestSnapshot.baseMonthlySalary,
                            latestSnapshot.salaryMonths,
                            locale
                          )}
                        </p>
                        {latestSnapshot.notes ? <p>{latestSnapshot.notes}</p> : null}
                      </div>

                      <div className="company-card__negotiation-history">
                        <p className="company-card__negotiation-eyebrow">{copy.history(snapshots.length)}</p>
                        {snapshots.map((snapshot) => (
                          <article className="company-card__negotiation-item" key={snapshot.id}>
                            <div className="company-card__negotiation-item-header">
                              <strong>{copy.version(snapshot.version)}</strong>
                              <span>{snapshot.title}</span>
                            </div>
                            <p>
                              {formatLocalizedCashWithMonths(
                                snapshot.baseMonthlySalary,
                                snapshot.salaryMonths,
                                locale
                              )}
                            </p>
                            {snapshot.hrSignal ? <p>{copy.hrSignal(snapshot.hrSignal)}</p> : null}
                            {snapshot.notes ? <p>{snapshot.notes}</p> : null}
                          </article>
                        ))}
                      </div>
                    </div>
                  </section>
                ) : null}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
