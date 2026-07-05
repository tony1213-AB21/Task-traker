"use client";

// Projects 패널: 프로젝트 카드 목록 (Org 메타데이터 포함). 카드에서 수정/삭제 가능.

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Pencil, Plus, Trash2 } from "lucide-react";
import type { DailyReport } from "@/lib/data/useDailyReport";
import type { Project } from "@/lib/types/database";
import { fmtHuman, minutesBetween, toLocalHM } from "@/lib/time/format";

export default function ProjectsPanel({
  report,
  onSelectEntry,
}: {
  report: DailyReport;
  date: string;
  onSelectEntry: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");

  return (
    <div className="flex flex-col gap-2.5 px-4 py-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.4px] text-ink-muted">
          Projects{" "}
          <span className="ml-1 font-normal text-ink-faint">
            {report.projects.length}
          </span>
        </h3>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11.5px] text-ink-faint transition hover:bg-line-soft hover:text-ink-mid"
        >
          <Plus size={11} /> 추가
        </button>
      </div>

      {adding && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface-alt p-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="프로젝트 이름"
            className="rounded-md border border-line px-2 py-1 text-[12px] outline-none focus:border-primary"
          />
          <input
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            placeholder="Org / 회사 (선택)"
            className="rounded-md border border-line px-2 py-1 text-[12px] outline-none focus:border-primary"
          />
          <div className="flex gap-1.5">
            <button
              onClick={async () => {
                if (!name.trim()) return;
                await report.createProject(name.trim(), org.trim());
                setName("");
                setOrg("");
                setAdding(false);
              }}
              disabled={!name.trim()}
              className="rounded-md bg-primary px-2.5 py-1 text-[11.5px] font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
            >
              만들기
            </button>
            <button
              onClick={() => setAdding(false)}
              className="rounded-md px-2 py-1 text-[11.5px] text-ink-muted transition hover:bg-line-soft"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {report.projects.length === 0 && !adding && (
        <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-[11.5px] text-ink-faint">
          아직 프로젝트가 없습니다.
          <br />
          Entry의 Detail에서 또는 여기에서 만들 수 있습니다.
        </p>
      )}

      {report.projects.map((p) => (
        <ProjectCard
          key={p.id}
          project={p}
          report={report}
          onSelectEntry={onSelectEntry}
        />
      ))}

      <Link
        href="/app/projects"
        className="flex items-center justify-center gap-1 rounded-lg border border-line px-3 py-2 text-[12px] font-medium text-ink-mid transition hover:bg-surface-alt"
      >
        전체 프로젝트 열기 <ArrowUpRight size={13} />
      </Link>
    </div>
  );
}

function ProjectCard({
  project,
  report,
  onSelectEntry,
}: {
  project: Project;
  report: DailyReport;
  onSelectEntry: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [org, setOrg] = useState(project.org_name ?? "");

  const entries = report.entries.filter((e) => e.project_id === project.id);
  const todayMinutes = entries.reduce(
    (sum, e) => sum + minutesBetween(e.start_at, e.end_at),
    0
  );
  const tasks = report.tasks.filter((t) => t.project_id === project.id);
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const pct =
    tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const recent = [...entries].slice(-2).reverse();

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface-alt p-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="프로젝트 이름"
          className="rounded-md border border-line px-2 py-1 text-[12px] outline-none focus:border-primary"
        />
        <input
          value={org}
          onChange={(e) => setOrg(e.target.value)}
          placeholder="Org / 회사 (선택)"
          className="rounded-md border border-line px-2 py-1 text-[12px] outline-none focus:border-primary"
        />
        <div className="flex gap-1.5">
          <button
            onClick={async () => {
              if (!name.trim()) return;
              await report.updateProject(project.id, {
                name: name.trim(),
                org_name: org.trim() || null,
              });
              setEditing(false);
            }}
            disabled={!name.trim()}
            className="rounded-md bg-primary px-2.5 py-1 text-[11.5px] font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
          >
            저장
          </button>
          <button
            onClick={() => {
              setName(project.name);
              setOrg(project.org_name ?? "");
              setEditing(false);
            }}
            className="rounded-md px-2 py-1 text-[11.5px] text-ink-muted transition hover:bg-line-soft"
          >
            취소
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group rounded-lg border border-line bg-surface p-3">
      <div className="mb-1 flex items-center gap-2">
        <span
          className="h-[9px] w-[9px] flex-none rounded-full"
          style={{ background: project.color ?? "#8f8a82" }}
        />
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink-strong">
          {project.name}
        </span>
        <span className="flex-none rounded bg-line-soft px-1.5 py-px text-[10.5px] text-ink-soft">
          {project.org_name ?? "—"}
        </span>
        <button
          onClick={() => setEditing(true)}
          title="프로젝트 수정"
          className="flex-none rounded-md p-0.5 text-ink-faint opacity-0 transition group-hover:opacity-100 hover:bg-line-soft hover:text-ink-mid"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={() => {
            if (
              window.confirm(
                "이 프로젝트를 삭제할까요?\n연결된 기록과 To-do는 남고, 프로젝트 표시만 사라집니다."
              )
            ) {
              report.deleteProject(project.id);
            }
          }}
          title="프로젝트 삭제"
          className="flex-none rounded-md p-0.5 text-ink-faint opacity-0 transition group-hover:opacity-100 hover:bg-[#f8ecea] hover:text-[#9a3b32]"
        >
          <Trash2 size={12} />
        </button>
      </div>
      <div className="mb-2 flex items-center gap-3 text-[11px] text-ink-muted">
        <span>
          오늘 <strong className="text-ink">{fmtHuman(todayMinutes)}</strong>
        </span>
        <span>
          To-do{" "}
          <strong className="text-ink">
            {doneTasks}/{tasks.length}
          </strong>
        </span>
      </div>
      {tasks.length > 0 && (
        <div className="mb-2 h-[6px] overflow-hidden rounded bg-line-soft">
          <span
            className="block h-full rounded"
            style={{
              width: `${pct}%`,
              background: project.color ?? "#8f8a82",
            }}
          />
        </div>
      )}
      {recent.length > 0 && (
        <div className="flex flex-col gap-0.5">
          {recent.map((e) => (
            <button
              key={e.id}
              onClick={() => onSelectEntry(e.id)}
              className="truncate text-left text-[11.5px] text-ink-muted transition hover:text-ink"
            >
              <span className="tabular-nums">{toLocalHM(e.start_at)}</span>{" "}
              {e.content || "내용 없음"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
