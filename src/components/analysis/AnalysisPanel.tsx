"use client";

// Analysis 패널: 컴팩트한 보조 지표. 메인 화면이 되지 않도록 조용하게 유지한다.
// Untracked = 첫 기록과 마지막 기록 사이의 빈 시간 (gap rule)

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { DailyReport } from "@/lib/data/useDailyReport";
import type { TypeKey } from "@/lib/types/database";
import { TYPE_META } from "@/lib/types/meta";
import {
  fmtHuman,
  minutesBetween,
  trackedMinutes,
  untrackedMinutes,
} from "@/lib/time/format";

export default function AnalysisPanel({
  report,
}: {
  report: DailyReport;
  date: string;
}) {
  const { entries, tasks } = report;

  const tracked = trackedMinutes(entries);
  const untracked = untrackedMinutes(entries);

  // To-do 완료율 (Today 목록 기준)
  const todayTasks = tasks.filter((t) => t.list === "today");
  const doneCount = todayTasks.filter((t) => t.status === "done").length;

  // Estimated vs Actual: 예상치가 있는 To-do 중 Entry에 연결된 것 기준
  const linkedTaskIds = new Set(
    entries.flatMap((e) => e.entry_tasks.map((et) => et.task_id))
  );
  const estimatedTasks = todayTasks.filter(
    (t) => t.estimated_minutes != null && linkedTaskIds.has(t.id)
  );
  const estimatedTotal = estimatedTasks.reduce(
    (sum, t) => sum + (t.estimated_minutes ?? 0),
    0
  );
  const actualForEstimated = entries
    .filter((e) =>
      e.entry_tasks.some((et) => estimatedTasks.some((t) => t.id === et.task_id))
    )
    .reduce((sum, e) => sum + minutesBetween(e.start_at, e.end_at), 0);

  // Type 분포
  const byType = new Map<TypeKey, number>();
  for (const e of entries) {
    byType.set(
      e.type_key,
      (byType.get(e.type_key) ?? 0) + minutesBetween(e.start_at, e.end_at)
    );
  }
  const typeRows = [...byType.entries()].sort((a, b) => b[1] - a[1]);
  const typeMax = Math.max(1, ...typeRows.map(([, m]) => m));

  // Project 시간
  const byProject = new Map<string, number>();
  for (const e of entries) {
    if (!e.project_id) continue;
    byProject.set(
      e.project_id,
      (byProject.get(e.project_id) ?? 0) +
        minutesBetween(e.start_at, e.end_at)
    );
  }
  const projectRows = [...byProject.entries()]
    .map(([id, m]) => ({
      project: report.projects.find((p) => p.id === id),
      minutes: m,
    }))
    .filter((r) => r.project)
    .sort((a, b) => b.minutes - a.minutes);
  const projMax = Math.max(1, ...projectRows.map((r) => r.minutes));

  // Problem 수 (오늘 Entry의 KPT+ 중 Problem이 작성된 것)
  const problemCount = entries.filter((e) =>
    e.kpt_notes.some((k) => (k.problem_text ?? "").trim().length > 0)
  ).length;

  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Tracked today" value={fmtHuman(tracked)} />
        <StatCard
          label="Untracked today"
          value={fmtHuman(untracked)}
          hint="첫 기록과 마지막 기록 사이의 빈 시간"
          accent="#b07a1e"
        />
        <StatCard
          label="To-do 완료"
          value={`${doneCount}/${todayTasks.length}`}
          hint="Today 목록 기준"
        />
        <StatCard
          label="Problem"
          value={`${problemCount}건`}
          hint="KPT+에 Problem이 작성된 기록"
        />
      </div>

      {/* Estimated vs Actual */}
      <section className="rounded-lg border border-line p-3">
        <h3 className="mb-2 text-[11.5px] font-semibold text-ink-muted">
          Estimated vs Actual
        </h3>
        {estimatedTotal === 0 ? (
          <p className="text-[11.5px] text-ink-faint">
            예상 시간이 있는 연결된 To-do가 없습니다.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <BarRow
              label="Estimated"
              minutes={estimatedTotal}
              max={Math.max(estimatedTotal, actualForEstimated)}
              color="#c3bfb9"
            />
            <BarRow
              label="Actual"
              minutes={actualForEstimated}
              max={Math.max(estimatedTotal, actualForEstimated)}
              color="#5e6ad2"
            />
          </div>
        )}
      </section>

      {/* Type 분포 */}
      <section className="rounded-lg border border-line p-3">
        <h3 className="mb-2 text-[11.5px] font-semibold text-ink-muted">
          Type 분포
        </h3>
        {typeRows.length === 0 ? (
          <p className="text-[11.5px] text-ink-faint">기록이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {typeRows.map(([key, minutes]) => (
              <BarRow
                key={key}
                label={TYPE_META[key]?.label ?? key}
                minutes={minutes}
                max={typeMax}
                color={TYPE_META[key]?.dot ?? "#8f8a82"}
              />
            ))}
          </div>
        )}
      </section>

      {/* Project 시간 */}
      <section className="rounded-lg border border-line p-3">
        <h3 className="mb-2 text-[11.5px] font-semibold text-ink-muted">
          Project 시간
        </h3>
        {projectRows.length === 0 ? (
          <p className="text-[11.5px] text-ink-faint">
            프로젝트에 연결된 기록이 없습니다.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {projectRows.map((r) => (
              <BarRow
                key={r.project!.id}
                label={r.project!.name}
                minutes={r.minutes}
                max={projMax}
                color={r.project!.color ?? "#8f8a82"}
              />
            ))}
          </div>
        )}
      </section>

      <Link
        href="/app/analysis"
        className="flex items-center justify-center gap-1 rounded-lg border border-line px-3 py-2 text-[12px] font-medium text-ink-mid transition hover:bg-surface-alt"
      >
        전체 분석 열기 <ArrowUpRight size={13} />
      </Link>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-line px-3 py-2.5" title={hint}>
      <p className="mb-0.5 text-[10.5px] font-medium text-ink-muted">{label}</p>
      <p
        className="tabular-nums text-[16px] font-semibold"
        style={{ color: accent ?? "#1a1d21" }}
      >
        {value}
      </p>
    </div>
  );
}

function BarRow({
  label,
  minutes,
  max,
  color,
}: {
  label: string;
  minutes: number;
  max: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[76px] flex-none truncate text-[11px] text-ink-soft">
        {label}
      </span>
      <span className="h-[8px] min-w-0 flex-1 overflow-hidden rounded bg-line-soft">
        <span
          className="block h-full rounded"
          style={{
            width: `${Math.max(2, Math.round((minutes / max) * 100))}%`,
            background: color,
          }}
        />
      </span>
      <span className="w-[46px] flex-none text-right tabular-nums text-[11px] text-ink-muted">
        {fmtHuman(minutes)}
      </span>
    </div>
  );
}
