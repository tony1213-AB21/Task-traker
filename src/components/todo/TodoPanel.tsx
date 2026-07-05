"use client";

// To-do 패널: Today / Backlog 목록, 생성, 수정, 삭제, 체크, 선택 Entry에 연결.
// 연결은 드래그 앤 드롭이 아니라 명시적 "선택 기록에 연결" 버튼을 사용한다.

import { useState } from "react";
import { CalendarDays, Clock3, Link2, Pencil, Plus, Trash2 } from "lucide-react";
import type { DailyReport } from "@/lib/data/useDailyReport";
import type {
  EntryWithRelations,
  Task,
  TaskList,
  TaskPriority,
} from "@/lib/types/database";
import { fmtTimeRange } from "@/lib/time/format";
import { PrioPill, ProjectChip, StatusPill } from "@/components/ui/pills";

export default function TodoPanel({
  report,
  selectedEntry,
}: {
  report: DailyReport;
  selectedEntry: EntryWithRelations | null;
}) {
  const today = report.tasks.filter((t) => t.list === "today");
  const backlog = report.tasks.filter((t) => t.list === "backlog");

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {selectedEntry ? (
        <p className="rounded-lg border border-[#e7e8f5] bg-[#f5f5fb] px-3 py-2 text-[11.5px] leading-relaxed text-[#454a78]">
          선택된 기록:{" "}
          <strong className="font-semibold">
            {fmtTimeRange(selectedEntry.start_at, selectedEntry.end_at)}{" "}
            {selectedEntry.content
              ? `· ${selectedEntry.content.slice(0, 16)}${selectedEntry.content.length > 16 ? "…" : ""}`
              : ""}
          </strong>
          <br />
          아래 To-do의 연결 버튼으로 이 기록에 연결할 수 있습니다.
        </p>
      ) : (
        <p className="rounded-lg border border-line bg-surface-alt px-3 py-2 text-[11.5px] text-ink-muted">
          표에서 기록을 선택하면 To-do를 그 기록에 연결할 수 있습니다.
        </p>
      )}

      <TodoSection
        title="Today"
        tasks={today}
        report={report}
        selectedEntry={selectedEntry}
        defaultList="today"
      />
      <TodoSection
        title="Backlog"
        tasks={backlog}
        report={report}
        selectedEntry={selectedEntry}
        defaultList="backlog"
      />
    </div>
  );
}

function TodoSection({
  title,
  tasks,
  report,
  selectedEntry,
  defaultList,
}: {
  title: string;
  tasks: Task[];
  report: DailyReport;
  selectedEntry: EntryWithRelations | null;
  defaultList: TaskList;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <section>
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.4px] text-ink-muted">
          {title}{" "}
          <span className="ml-1 font-normal text-ink-faint">
            {tasks.length}
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
        <TaskForm
          report={report}
          defaultList={defaultList}
          onDone={() => setAdding(false)}
        />
      )}

      <div className="flex flex-col gap-1.5">
        {tasks.length === 0 && !adding && (
          <p className="rounded-lg border border-dashed border-line px-3 py-2.5 text-center text-[11.5px] text-ink-faint">
            비어 있습니다
          </p>
        )}
        {tasks.map((t) => (
          <TodoCard
            key={t.id}
            task={t}
            report={report}
            selectedEntry={selectedEntry}
          />
        ))}
      </div>
    </section>
  );
}

function TodoCard({
  task,
  report,
  selectedEntry,
}: {
  task: Task;
  report: DailyReport;
  selectedEntry: EntryWithRelations | null;
}) {
  const [editing, setEditing] = useState(false);
  const done = task.status === "done";
  const project = task.project_id
    ? report.projects.find((p) => p.id === task.project_id)
    : null;
  const alreadyLinked = selectedEntry?.entry_tasks.some(
    (et) => et.task_id === task.id
  );

  if (editing) {
    return (
      <TaskForm
        report={report}
        defaultList={task.list}
        task={task}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="group rounded-lg border border-line bg-surface px-2.5 py-2 transition hover:bg-surface-alt">
      <div className="flex items-start gap-2">
        <button
          onClick={() => report.toggleTaskDone(task.id)}
          aria-label={done ? "완료 해제" : "완료로 표시"}
          className={`mt-[2px] inline-flex h-[15px] w-[15px] flex-none items-center justify-center rounded-[4px] border text-[10px] transition ${
            done
              ? "border-[#3f9155] bg-[#3f9155] text-white"
              : "border-line-strong bg-surface hover:border-[#3f9155]"
          }`}
        >
          {done ? "✓" : ""}
        </button>
        <div className="min-w-0 flex-1">
          <p
            className={`text-[12.5px] leading-snug ${
              done ? "text-ink-faint line-through" : "text-ink"
            }`}
          >
            {task.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <PrioPill priority={task.priority as TaskPriority} />
            {task.status !== "not_started" && (
              <StatusPill status={task.status} />
            )}
            {project && <ProjectChip project={project} />}
            {task.due_date && (
              <span className="flex items-center gap-0.5 text-[11px] text-ink-faint">
                <CalendarDays size={11} />
                {task.due_date.slice(5).replace("-", "/")}
              </span>
            )}
            {task.estimated_minutes != null && (
              <span className="flex items-center gap-0.5 text-[11px] text-ink-faint">
                <Clock3 size={11} />
                {task.estimated_minutes}m
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-none items-center gap-0.5">
          <button
            onClick={() => setEditing(true)}
            title="To-do 수정"
            className="rounded-md p-1 text-ink-faint opacity-0 transition group-hover:opacity-100 hover:bg-line-soft hover:text-ink-mid"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => {
              if (
                window.confirm(
                  "이 To-do를 삭제할까요?\n연결된 기록은 남고, To-do 표시만 사라집니다."
                )
              ) {
                report.deleteTask(task.id);
              }
            }}
            title="To-do 삭제"
            className="rounded-md p-1 text-ink-faint opacity-0 transition group-hover:opacity-100 hover:bg-[#f8ecea] hover:text-[#9a3b32]"
          >
            <Trash2 size={12} />
          </button>
          {selectedEntry && (
            <button
              onClick={() =>
                alreadyLinked
                  ? report.detachTask(selectedEntry.id, task.id)
                  : report.attachTask(selectedEntry.id, task.id)
              }
              title={alreadyLinked ? "연결 해제" : "선택 기록에 연결"}
              className={`rounded-md p-1 transition ${
                alreadyLinked
                  ? "bg-[#eeeef7] text-primary"
                  : "text-ink-faint hover:bg-line-soft hover:text-ink-mid"
              }`}
            >
              <Link2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// task를 주면 수정 폼, 없으면 생성 폼으로 동작한다.
function TaskForm({
  report,
  defaultList,
  task,
  onDone,
}: {
  report: DailyReport;
  defaultList: TaskList;
  task?: Task;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? "medium"
  );
  const [projectId, setProjectId] = useState(task?.project_id ?? "");
  const [due, setDue] = useState(task?.due_date ?? "");
  const [est, setEst] = useState(
    task?.estimated_minutes != null ? String(task.estimated_minutes) : ""
  );

  async function submit() {
    if (!title.trim()) return;
    const fields = {
      title: title.trim(),
      priority,
      project_id: projectId || null,
      due_date: due || null,
      estimated_minutes: est ? parseInt(est, 10) || null : null,
    };
    if (task) {
      await report.updateTask(task.id, fields);
    } else {
      await report.createTask({ ...fields, list: defaultList });
    }
    onDone();
  }

  return (
    <div className="mb-1.5 flex flex-col gap-1.5 rounded-lg border border-line bg-surface-alt p-2">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") onDone();
        }}
        placeholder="할 일 제목"
        className="rounded-md border border-line px-2 py-1.5 text-[12.5px] outline-none focus:border-primary"
      />
      <div className="flex gap-1.5">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          className="min-w-0 flex-1 rounded-md border border-line bg-surface px-1.5 py-1 text-[11.5px] outline-none focus:border-primary"
        >
          <option value="high">High</option>
          <option value="medium">Med</option>
          <option value="low">Low</option>
        </select>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="min-w-0 flex-[2] rounded-md border border-line bg-surface px-1.5 py-1 text-[11.5px] outline-none focus:border-primary"
        >
          <option value="">프로젝트 없음</option>
          {report.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-1.5">
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="min-w-0 flex-[3] rounded-md border border-line bg-surface px-1.5 py-1 text-[11.5px] outline-none focus:border-primary"
          title="마감일"
        />
        <input
          type="number"
          min={0}
          value={est}
          onChange={(e) => setEst(e.target.value)}
          placeholder="예상(분)"
          className="min-w-0 flex-[2] rounded-md border border-line bg-surface px-1.5 py-1 text-[11.5px] outline-none focus:border-primary"
          title="예상 소요 시간(분)"
        />
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={submit}
          disabled={!title.trim()}
          className="rounded-md bg-primary px-2.5 py-1 text-[11.5px] font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
        >
          {task ? "저장" : "추가"}
        </button>
        <button
          onClick={onDone}
          className="rounded-md px-2 py-1 text-[11.5px] text-ink-muted transition hover:bg-line-soft"
        >
          취소
        </button>
      </div>
    </div>
  );
}
