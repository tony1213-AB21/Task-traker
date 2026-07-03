"use client";

// 전체 프로젝트 페이지 (v1: 단순 카드 그리드)

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useDailyReport } from "@/lib/data/useDailyReport";
import { fmtHuman, minutesBetween, todayStr } from "@/lib/time/format";

export default function ProjectsPage() {
  const report = useDailyReport(todayStr());

  return (
    <div className="min-h-screen bg-canvas">
      <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2.5">
        <Link
          href="/app"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[12.5px] text-ink-mid transition hover:bg-line-soft"
        >
          <ArrowLeft size={14} /> Daily Report
        </Link>
        <h1 className="text-[14px] font-semibold text-ink-strong">
          전체 프로젝트
        </h1>
      </header>

      <main className="mx-auto max-w-[840px] px-4 py-6">
        {report.loading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl bg-line-soft"
              />
            ))}
          </div>
        ) : report.projects.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-surface px-6 py-10 text-center text-[13px] text-ink-faint">
            아직 프로젝트가 없습니다. Daily Report 화면의 Projects 패널에서 만들
            수 있습니다.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {report.projects.map((p) => {
              const entries = report.entries.filter(
                (e) => e.project_id === p.id
              );
              const todayMinutes = entries.reduce(
                (sum, e) => sum + minutesBetween(e.start_at, e.end_at),
                0
              );
              const tasks = report.tasks.filter(
                (t) => t.project_id === p.id
              );
              const done = tasks.filter((t) => t.status === "done").length;
              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-line bg-surface p-4"
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <span
                      className="h-[10px] w-[10px] flex-none rounded-full"
                      style={{ background: p.color ?? "#8f8a82" }}
                    />
                    <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-ink-strong">
                      {p.name}
                    </span>
                    <span className="flex-none rounded bg-line-soft px-2 py-0.5 text-[11px] text-ink-soft">
                      {p.org_name ?? "—"}
                    </span>
                  </div>
                  {p.description && (
                    <p className="mb-2 text-[12px] text-ink-muted">
                      {p.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-[12px] text-ink-muted">
                    <span>
                      오늘{" "}
                      <strong className="text-ink">
                        {fmtHuman(todayMinutes)}
                      </strong>
                    </span>
                    <span>
                      To-do{" "}
                      <strong className="text-ink">
                        {done}/{tasks.length}
                      </strong>
                    </span>
                    <span className="ml-auto text-[11px] text-ink-faint">
                      {p.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
