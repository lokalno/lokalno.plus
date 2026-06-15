"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PROM_IMPORT_BATCH_SIZE } from "@/lib/prom-import";

type ImportDetail = {
  rowNumber: number;
  title?: string;
  reason?: string;
  listingId?: string;
};

type ImportSession = {
  id: string;
  fileHash: string;
  fileName: string | null;
  totalRows: number;
  nextOffset: number;
  status: string;
  hasMore: boolean;
  updatedAt: string;
};

type ImportReport = {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  details: {
    created: ImportDetail[];
    updated: ImportDetail[];
    skipped: ImportDetail[];
    errors: ImportDetail[];
    warnings: ImportDetail[];
  };
  totalInFile: number;
  offset: number;
  nextOffset: number;
  hasMore: boolean;
  batchSize: number;
  sessionId: string;
  session: ImportSession;
};

const emptyCumulative = { created: 0, updated: 0, skipped: 0, errors: 0, warnings: 0 };

export default function PromImportForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [savedSession, setSavedSession] = useState<ImportSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [cumulative, setCumulative] = useState(emptyCumulative);
  const [reimportPrompt, setReimportPrompt] = useState<ImportSession | null>(null);

  const loadSavedSession = useCallback(async () => {
    setLoadingSession(true);
    try {
      const res = await fetch("/api/listings/import/session");
      if (!res.ok) return;
      const data = await res.json();
      setSavedSession(data.session ?? null);
    } finally {
      setLoadingSession(false);
    }
  }, []);

  useEffect(() => {
    void loadSavedSession();
  }, [loadSavedSession]);

  function handleFileChange(selected: File | null) {
    setFile(selected);
    setReport(null);
    setCumulative(emptyCumulative);
    setReimportPrompt(null);
    setError(null);
  }

  async function runImport(options: {
    forceRestart?: boolean;
    confirmReimport?: boolean;
    appendStats?: boolean;
  }) {
    if (!file) {
      setError("Спочатку оберіть файл Excel або CSV з Prom.ua");
      return;
    }

    setLoading(true);
    setError(null);
    setReimportPrompt(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (options.forceRestart) {
        formData.append("forceRestart", "true");
      }
      if (options.confirmReimport) {
        formData.append("confirmReimport", "true");
      }

      const res = await fetch("/api/listings/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.status === 409 && data.requiresReimportConfirmation && data.session) {
        setReimportPrompt(data.session as ImportSession);
        return;
      }

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Помилка імпорту");
        return;
      }

      const batchReport = data as ImportReport;
      setReport(batchReport);
      setSavedSession(batchReport.session);
      setCumulative((prev) =>
        options.appendStats
          ? {
              created: prev.created + batchReport.created,
              updated: prev.updated + batchReport.updated,
              skipped: prev.skipped + batchReport.skipped,
              errors: prev.errors + batchReport.errors,
              warnings: prev.warnings + (batchReport.details.warnings?.length ?? 0),
            }
          : {
              created: batchReport.created,
              updated: batchReport.updated,
              skipped: batchReport.skipped,
              errors: batchReport.errors,
              warnings: batchReport.details.warnings?.length ?? 0,
            }
      );
    } catch {
      setError("Не вдалося завантажити файл. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  }

  async function cancelSavedSession() {
    if (!savedSession) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/listings/import/session?id=${savedSession.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError("Не вдалося скасувати сесію імпорту");
        return;
      }
      setSavedSession(null);
      setReport(null);
      setCumulative(emptyCumulative);
    } finally {
      setLoading(false);
    }
  }

  const activeSession = report?.session ?? savedSession;
  const canContinue = Boolean(activeSession?.hasMore && activeSession.status === "IN_PROGRESS");

  function formatSessionDate(iso: string): string {
    try {
      return new Intl.DateTimeFormat("uk-UA", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  return (
    <div className="space-y-6">
      {reimportPrompt && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:p-6 space-y-3">
          <h2 className="text-lg font-semibold text-amber-950">Повторний імпорт файлу</h2>
          <p className="text-sm text-amber-950/90 leading-relaxed">
            Файл <strong>{reimportPrompt.fileName ?? file?.name ?? "Prom export"}</strong> уже було
            повністю імпортовано
            {reimportPrompt.updatedAt ? (
              <>
                {" "}
                (<time dateTime={reimportPrompt.updatedAt}>
                  {formatSessionDate(reimportPrompt.updatedAt)}
                </time>
                )
              </>
            ) : null}
            . У файлі <strong>{reimportPrompt.totalRows}</strong> товарів. Повторний імпорт{" "}
            <strong>оновить</strong> існуючі оголошення за Prom ID (назва, фото, ціна, наявність,
            характеристики). Нові рядки без Prom ID можуть створити дублікати.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!file || loading}
              onClick={() => runImport({ confirmReimport: true, appendStats: false })}
              className="inline-flex items-center justify-center rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Імпорт…" : "Оновити існуючі"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setReimportPrompt(null)}
              className="inline-flex items-center justify-center rounded-xl border border-amber-400 bg-white px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100/70 disabled:opacity-50"
            >
              Скасувати
            </button>
          </div>
        </div>
      )}

      {!loadingSession && activeSession && activeSession.hasMore && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 sm:p-6 space-y-3">
          <h2 className="text-lg font-semibold text-brand-900">Незавершений імпорт</h2>
          <p className="text-sm text-brand-900/90 leading-relaxed">
            Файл: <strong>{activeSession.fileName ?? "Prom export"}</strong>
            <br />
            Оброблено <strong>{activeSession.nextOffset}</strong> з{" "}
            <strong>{activeSession.totalRows}</strong> товарів. Оберіть{" "}
            <strong>той самий файл</strong> і натисніть «Продовжити імпорт».
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!file || loading}
              onClick={() => runImport({ appendStats: true })}
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Імпорт…" : "Продовжити імпорт"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void cancelSavedSession()}
              className="inline-flex items-center justify-center rounded-xl border border-brand-300 bg-white px-4 py-2 text-sm font-medium text-brand-900 hover:bg-brand-100/60 disabled:opacity-50"
            >
              Скасувати сесію
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">Завантаження файлу</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Експортуйте товари з Prom.ua у форматі Excel (XLSX) або CSV. За один раз імпортується до{" "}
          <strong>{PROM_IMPORT_BATCH_SIZE} товарів</strong>. Повторний імпорт того самого файлу після
          завершення потребує підтвердження — оновлюються існуючі товари за Prom ID, а не дублюються.
        </p>

        <ul className="mt-3 list-disc pl-5 text-sm text-gray-600 space-y-1">
          <li>Ключ: Унікальний_ідентифікатор → Ідентифікатор_товару → Код_товару</li>
          <li>Без Prom ID — створюється нове оголошення (можливі дублікати)</li>
          <li>ACTIVE оголошення при оновленні залишаються ACTIVE</li>
          <li>Прогрес зберігається на сервері — можна продовжити після виходу</li>
        </ul>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-800 hover:file:bg-brand-100"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              disabled={!file || loading}
              onClick={() => runImport({ appendStats: false })}
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Імпорт…" : canContinue ? "Продовжити імпорт" : "Імпортувати"}
            </button>
            {canContinue && (
              <button
                type="button"
                disabled={!file || loading}
                onClick={() => runImport({ forceRestart: true, appendStats: false })}
                className="inline-flex items-center justify-center rounded-xl border border-brand-300 bg-white px-5 py-2.5 text-sm font-medium text-brand-900 hover:bg-brand-100/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Почати з початку
              </button>
            )}
          </div>
        </div>

        {file && (
          <p className="mt-3 text-sm text-gray-500">
            Файл: <span className="font-medium text-gray-700">{file.name}</span>
            {report && (
              <>
                {" "}
                · у файлі <span className="font-medium">{report.totalInFile}</span> рядків
              </>
            )}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {report && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Звіт імпорту</h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <StatCard label="Створено" value={cumulative.created} tone="green" />
            <StatCard label="Оновлено" value={cumulative.updated} tone="blue" />
            <StatCard label="Пропущено" value={cumulative.skipped} tone="amber" />
            <StatCard label="Помилки" value={cumulative.errors} tone="red" />
            <StatCard label="Попередження" value={cumulative.warnings} tone="gray" />
          </div>

          {report.hasMore && (
            <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
              Оброблено рядки {report.offset + 1}–{report.offset + report.batchSize} з{" "}
              {report.totalInFile}. Залишилось{" "}
              {Math.max(0, report.totalInFile - report.nextOffset)} товарів.
            </div>
          )}

          <ImportDetailsList title="Створено" items={report.details.created} tone="green" />
          <ImportDetailsList title="Оновлено" items={report.details.updated} tone="blue" />
          <ImportDetailsList title="Пропущено" items={report.details.skipped} tone="amber" showReason />
          <ImportDetailsList title="Помилки" items={report.details.errors} tone="red" showReason />
          <ImportDetailsList
            title="Попередження"
            items={report.details.warnings}
            tone="gray"
            showReason
          />

          <div className="flex flex-wrap gap-3 pt-2">
            {report.hasMore && (
              <button
                type="button"
                disabled={loading || !file}
                onClick={() => runImport({ appendStats: true })}
                className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Імпорт…"
                  : `Імпортувати наступні ${PROM_IMPORT_BATCH_SIZE}`}
              </button>
            )}
            <Link
              href="/profile"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Мої оголошення
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "blue" | "amber" | "red" | "gray";
}) {
  const styles = {
    green: "bg-green-50 border-green-200 text-green-800",
    blue: "bg-sky-50 border-sky-200 text-sky-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    red: "bg-red-50 border-red-200 text-red-800",
    gray: "bg-gray-50 border-gray-200 text-gray-800",
  }[tone];

  return (
    <div className={`rounded-xl border px-4 py-3 ${styles}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-90">{label}</div>
    </div>
  );
}

function ImportDetailsList({
  title,
  items,
  tone,
  showReason = false,
}: {
  title: string;
  items: ImportDetail[];
  tone: "green" | "blue" | "amber" | "red" | "gray";
  showReason?: boolean;
}) {
  if (items.length === 0) return null;

  const toneClasses = {
    green: "text-green-900",
    blue: "text-sky-900",
    amber: "text-amber-900",
    red: "text-red-900",
    gray: "text-gray-900",
  }[tone];

  return (
    <div>
      <h3 className={`text-sm font-semibold ${toneClasses}`}>
        {title} ({items.length} у цій порції)
      </h3>
      <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700 space-y-1">
        {items.slice(0, 30).map((item) => (
          <li key={`${title}-${item.rowNumber}-${item.title ?? ""}-${item.reason ?? ""}`}>
            <span className="text-gray-500">Рядок {item.rowNumber}:</span>{" "}
            {item.title ?? "—"}
            {showReason && item.reason ? (
              <span className="text-gray-500"> — {item.reason}</span>
            ) : null}
          </li>
        ))}
        {items.length > 30 && (
          <li className="text-gray-500">… і ще {items.length - 30}</li>
        )}
      </ul>
    </div>
  );
}
