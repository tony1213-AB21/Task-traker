"use client";

// 전체 분석 페이지 (v1: 오늘 데이터 기준의 단순 페이지)

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, format, parse } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDailyReport } from "@/lib/data/useDailyReport";
import type { TypeKey } from "@/lib/types/database";
import { TYPE_META } from "@/lib/types/meta";
import {
  fmtDateLabel,
  fmtHuman,
  minutesBetween,
  trackedMinutes,
  untrackedMinutes,
  todayStr,
} from "@/lib/time/format";

export default function AnalysisPage() {
  const [date, setDate] = useState(todayStr());
  const report = useDailyReport(date);

  function moveDate(delta: number) {
    const d = parse(date, "yyyy-MM-dd", new Date());
    setDate(format(addDays(d, delta), "yyyy-MM-dd"));
  }

  const tracked = trackedMinutes(report.entries);
  const untracked = untrackedMinutes(report.entries);
  const todayTasks = report.tasks.filter((t) => t.list === "today");
  const doneCount = todayTasks.filter((t) => t.status === "done").length;

  const byType = new Map<TypeKey, number>();
  for (const e of report.entries) {
    byType.set(
      e.type_key,
      (byType.get(e.type_key) ?? 0) + minutesBetween(e.start_at, e.end_at)
    );
  }
  const typeData = [...byType.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, minutes]) => ({
      name: TYPE_META[key]?.label ?? key,
      minutes,
      fill: TYPE_META[key]?.dot ?? "#8f8a82",
    }));

  const byProject = new Map<string, number>();
  for (const e of report.entries) {
    if (!e.project_id) continue;
    byProject.set(
      e.project_id,
      (byProject.get(e.project_id) ?? 0) +
        minutesBetween(e.start_at, e.end_at)
    );
  }
  const projectData = [...byProject.entries()]
    .map(([id, minutes]) => {
      const p = report.projects.find((pr) => pr.id === id);
      return {
        name: p?.name ?? "?",
        minutes,
        fill: p?.color ?? "#8f8a82",
      };
    })
    .sort((a, b) => b.minutes - a.minutes);

  return (
    <div className="min-h-screen bg-canvas">
      <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2.5">
        <Link
          href="/app"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[12.5px] text-ink-mid transition hover:bg-line-soft"
        >
          <ArrowLeft size={14} /> Daily Report
        </Link>
        <h1 className="text-[14px] font-semibold text-ink-strong">전체 분석</h1>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => moveDate(-1)}
            className="rounded-md p-1 text-ink-muted transition hover:bg-line-soft"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-[13px] font-medium text-ink">
            {fmtDateLabel(date)}
          </span>
          <button
            onClick={() => moveDate(1)}
            className="rounded-md p-1 text-ink-muted transition hover:bg-line-soft"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[840px] px-4 py-6">
        {report.loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl bg-line-soft"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Card label="Tracked" value={fmtHuman(tracked)} />
              <Card
                label="Untracked"
                value={fmtHuman(untracked)}
                accent="#b07a1e"
              />
              <Card label="기록 수" value={`${report.entries.length}개`} />
              <Card
                label="To-do 완료"
                value={`${doneCount}/${todayTasks.length}`}
              />
            </div>

            <ChartCard title="Type 분포">
              {typeData.length === 0 ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={typeData}
                    layout="vertical"
                    margin={{ left: 24, right: 24 }}
                  >
                    <CartesianGrid
                      horizontal={false}
                      stroke="#f2f1ee"
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#8f8a82" }}
                      tickFormatter={(v) => fmtHuman(v as number)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={72}
                      tick={{ fontSize: 11, fill: "#615d59" }}
                    />
                    <Tooltip
                      formatter={(v) => [fmtHuman(v as number), "시간"]}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Bar dataKey="minutes" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Project 시간">
              {projectData.length === 0 ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={projectData}
                    layout="vertical"
                    margin={{ left: 24, right: 24 }}
                  >
                    <CartesianGrid horizontal={false} stroke="#f2f1ee" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#8f8a82" }}
                      tickFormatter={(v) => fmtHuman(v as number)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tick={{ fontSize: 11, fill: "#615d59" }}
                    />
                    <Tooltip
                      formatter={(v) => [fmtHuman(v as number), "시간"]}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Bar dataKey="minutes" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        )}
      </main>
    </div>
  );
}

function Card({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <p className="mb-1 text-[11px] font-medium text-ink-muted">{label}</p>
      <p
        className="tabular-nums text-[20px] font-semibold"
        style={{ color: accent ?? "#1a1d21" }}
      >
        {value}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <h2 className="mb-3 text-[13px] font-semibold text-ink-strong">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Empty() {
  return (
    <p className="py-8 text-center text-[12.5px] text-ink-faint">
      표시할 데이터가 없습니다.
    </p>
  );
}
