"use client";

// Detail 패널: 선택한 Entry의 모든 필드를 편집한다.
// Time/Duration/Type/Subtype/Project/Content/Related To-do/Links/Status/Tags

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Link2, Plus, Trash2, X } from "lucide-react";
import type { DailyReport } from "@/lib/data/useDailyReport";
import type {
  EntryStatus,
  EntryWithRelations,
  TypeKey,
} from "@/lib/types/database";
import {
  ANALYTICS_BUCKET_OPTIONS,
  STATUS_KEYS,
  STATUS_META,
  TYPE_KEYS,
  TYPE_META,
} from "@/lib/types/meta";
import {
  combineDateTime,
  fmtHM,
  fmtTimeRange,
  minutesBetween,
  toLocalHM,
} from "@/lib/time/format";
import { TodoChip } from "@/components/ui/pills";

interface DetailPanelProps {
  report: DailyReport;
  entry: EntryWithRelations | null;
  overlaps: Map<string, EntryWithRelations[]>;
}

export default function DetailPanel({
  report,
  entry,
  overlaps,
}: DetailPanelProps) {
  if (!entry) {
    return (
      <PanelEmpty
        title="선택된 기록이 없습니다"
        body="표에서 행을 선택하면 여기에서 편집할 수 있습니다."
      />
    );
  }
  return <DetailBody key={entry.id} report={report} entry={entry} overlaps={overlaps} />;
}

function DetailBody({
  report,
  entry,
  overlaps,
}: {
  report: DailyReport;
  entry: EntryWithRelations;
  overlaps: Map<string, EntryWithRelations[]>;
}) {
  const index = report.entries.findIndex((e) => e.id === entry.id);
  const project = entry.project_id
    ? report.projects.find((p) => p.id === entry.project_id)
    : null;
  const warn = overlaps.get(entry.id);

  // 로컬 편집 상태 (entry.id 변경 시 key로 리마운트되어 초기화됨)
  const [startHM, setStartHM] = useState(toLocalHM(entry.start_at));
  const [endHM, setEndHM] = useState(toLocalHM(entry.end_at));
  const [content, setContent] = useState(entry.content ?? "");
  const [tagsInput, setTagsInput] = useState(entry.tags.join(", "));
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [newSubtype, setNewSubtype] = useState("");
  const [showSubtypeInput, setShowSubtypeInput] = useState(false);

  // 다른 세션/패널에서 갱신된 콘텐츠 반영
  useEffect(() => {
    setStartHM(toLocalHM(entry.start_at));
    setEndHM(toLocalHM(entry.end_at));
  }, [entry.start_at, entry.end_at]);

  const subtypesForType = useMemo(
    () => report.subtypes.filter((s) => s.type_key === entry.type_key),
    [report.subtypes, entry.type_key]
  );

  function commitTime() {
    if (!/^\d{1,2}:\d{2}$/.test(startHM) || !/^\d{1,2}:\d{2}$/.test(endHM)) {
      setStartHM(toLocalHM(entry.start_at));
      setEndHM(toLocalHM(entry.end_at));
      return;
    }
    const start = combineDateTime(entry.report_date, startHM);
    const end = combineDateTime(entry.report_date, endHM);
    if (end <= start) end.setDate(end.getDate() + 1); // 자정 넘김 허용
    report.updateEntry(entry.id, {
      start_at: start.toISOString(),
      end_at: end.toISOString(),
    });
  }

  function commitContent() {
    if (content !== (entry.content ?? "")) {
      report.updateEntry(entry.id, { content });
    }
  }

  function commitTags() {
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (JSON.stringify(tags) !== JSON.stringify(entry.tags)) {
      report.updateEntry(entry.id, { tags });
    }
  }

  const duration = minutesBetween(entry.start_at, entry.end_at);

  return (
    <div className="flex flex-col">
      {/* 헤더: Entry 컨텍스트 */}
      <div className="border-b border-line px-4 py-3">
        <div className="mb-0.5 flex items-center justify-between">
          <span className="text-[11.5px] font-semibold text-ink-muted">
            Entry #{String(index + 1).padStart(2, "0")}
          </span>
          <button
            onClick={() => {
              if (window.confirm("이 기록을 삭제할까요?")) {
                report.deleteEntry(entry.id);
              }
            }}
            title="기록 삭제"
            className="rounded-md p-1 text-ink-faint transition hover:bg-[#f8ecea] hover:text-[#9a3b32]"
          >
            <Trash2 size={13} />
          </button>
        </div>
        <p className="tabular-nums text-[15px] font-semibold text-ink-strong">
          {fmtTimeRange(entry.start_at, entry.end_at)} · {fmtHM(duration)}
        </p>
        <p className="mt-0.5 text-[12px] text-ink-muted">
          {project
            ? `Project: ${project.name} · Org: ${project.org_name ?? "—"}`
            : "프로젝트 없음"}
        </p>
        {warn && warn.length > 0 && (
          <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-[#f0e4cf] bg-[#fbf6ee] px-2.5 py-2 text-[11.5px] leading-relaxed text-[#77621f]">
            <AlertTriangle size={13} className="mt-px flex-none" />
            <span>
              이 기록은 {fmtTimeRange(warn[0].start_at, warn[0].end_at)}{" "}
              {warn[0].content ? `“${warn[0].content.slice(0, 18)}…”` : "다른 기록"}
              과 시간이 겹칩니다. 그래도 저장할 수 있습니다.
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        {/* Time range + Duration */}
        <Field label="Time">
          <div className="flex items-center gap-1.5">
            <input
              value={startHM}
              onChange={(e) => setStartHM(e.target.value)}
              onBlur={commitTime}
              onKeyDown={(e) => e.key === "Enter" && commitTime()}
              className="w-[64px] rounded-md border border-line px-2 py-1 text-center tabular-nums text-[12.5px] outline-none transition focus:border-primary"
            />
            <span className="text-ink-faint">–</span>
            <input
              value={endHM}
              onChange={(e) => setEndHM(e.target.value)}
              onBlur={commitTime}
              onKeyDown={(e) => e.key === "Enter" && commitTime()}
              className="w-[64px] rounded-md border border-line px-2 py-1 text-center tabular-nums text-[12.5px] outline-none transition focus:border-primary"
            />
            <span className="ml-2 tabular-nums text-[12px] text-ink-muted">
              Duration {fmtHM(duration)}
            </span>
          </div>
        </Field>

        {/* Type */}
        <Field label="Type">
          <div className="flex flex-wrap gap-1">
            {TYPE_KEYS.map((key) => {
              const meta = TYPE_META[key];
              const active = entry.type_key === key;
              return (
                <button
                  key={key}
                  onClick={() =>
                    report.updateEntry(entry.id, {
                      type_key: key as TypeKey,
                      subtype_id: null,
                    })
                  }
                  className="rounded-md px-2 py-[3px] text-[11.5px] font-medium transition"
                  style={{
                    background: meta.bg,
                    color: meta.fg,
                    outline: active ? `2px solid ${meta.dot}` : "none",
                    outlineOffset: 1,
                    opacity: active ? 1 : 0.75,
                  }}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Subtype */}
        <Field label="Subtype">
          <div className="flex flex-wrap items-center gap-1">
            {subtypesForType.map((s) => {
              const active = entry.subtype_id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() =>
                    report.updateEntry(entry.id, {
                      subtype_id: active ? null : s.id,
                    })
                  }
                  className={`rounded-md border px-2 py-[3px] text-[11.5px] transition ${
                    active
                      ? "border-primary bg-[#eeeef7] font-medium text-primary"
                      : "border-line bg-surface-alt text-ink-soft hover:border-line-strong"
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
            {showSubtypeInput ? (
              <span className="flex items-center gap-1">
                <input
                  autoFocus
                  value={newSubtype}
                  onChange={(e) => setNewSubtype(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && newSubtype.trim()) {
                      const created = await report.createSubtype(
                        entry.type_key,
                        newSubtype.trim()
                      );
                      if (created) {
                        report.updateEntry(entry.id, { subtype_id: created.id });
                      }
                      setNewSubtype("");
                      setShowSubtypeInput(false);
                    }
                    if (e.key === "Escape") setShowSubtypeInput(false);
                  }}
                  placeholder="새 서브타입"
                  className="w-[100px] rounded-md border border-line px-2 py-[3px] text-[11.5px] outline-none focus:border-primary"
                />
                <button
                  onClick={() => setShowSubtypeInput(false)}
                  className="text-ink-faint"
                >
                  <X size={12} />
                </button>
              </span>
            ) : (
              <button
                onClick={() => setShowSubtypeInput(true)}
                className="flex items-center gap-0.5 rounded-md px-1.5 py-[3px] text-[11.5px] text-ink-faint transition hover:bg-line-soft hover:text-ink-mid"
              >
                <Plus size={11} /> 추가
              </button>
            )}
          </div>
        </Field>

        {/* Project */}
        <Field label="Project">
          <div className="flex flex-col gap-1.5">
            <select
              value={entry.project_id ?? ""}
              onChange={(e) =>
                report.updateEntry(entry.id, {
                  project_id: e.target.value || null,
                })
              }
              className="w-full rounded-md border border-line bg-surface px-2 py-1.5 text-[12.5px] text-ink outline-none transition focus:border-primary"
            >
              <option value="">프로젝트 없음</option>
              {report.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.org_name ? ` · ${p.org_name}` : ""}
                </option>
              ))}
            </select>
            {showProjectForm ? (
              <NewProjectForm
                onCancel={() => setShowProjectForm(false)}
                onCreate={async (name, org, bucket) => {
                  const created = await report.createProject(name, org, bucket);
                  if (created) {
                    report.updateEntry(entry.id, { project_id: created.id });
                  }
                  setShowProjectForm(false);
                }}
              />
            ) : (
              <button
                onClick={() => setShowProjectForm(true)}
                className="flex w-fit items-center gap-0.5 text-[11.5px] text-ink-faint transition hover:text-ink-mid"
              >
                <Plus size={11} /> 새 프로젝트 만들기
              </button>
            )}
          </div>
        </Field>

        {/* Content */}
        <Field label="Content">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={commitContent}
            rows={5}
            placeholder="무엇을 했는지 적어보세요"
            className="w-full resize-y rounded-lg border border-line px-2.5 py-2 text-[13px] leading-relaxed text-ink outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_rgba(94,106,210,0.16)]"
          />
        </Field>

        {/* Related To-do */}
        <Field label="Related To-do">
          <div className="flex flex-col gap-1.5">
            {entry.entry_tasks.map(
              (et) =>
                et.tasks && (
                  <div
                    key={et.task_id}
                    className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5"
                  >
                    <button
                      onClick={() => report.toggleTaskDone(et.task_id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <TodoChip
                        title={et.tasks.title}
                        done={et.tasks.status === "done"}
                      />
                    </button>
                    <button
                      onClick={() => report.detachTask(entry.id, et.task_id)}
                      title="연결 해제"
                      className="flex-none text-ink-faint transition hover:text-[#9a3b32]"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )
            )}
            {showTaskPicker ? (
              <TaskPicker
                report={report}
                excludeIds={entry.entry_tasks.map((et) => et.task_id)}
                onPick={(taskId) => {
                  report.attachTask(entry.id, taskId);
                  setShowTaskPicker(false);
                }}
                onClose={() => setShowTaskPicker(false)}
              />
            ) : (
              <button
                onClick={() => setShowTaskPicker(true)}
                className="flex w-fit items-center gap-0.5 text-[11.5px] text-ink-faint transition hover:text-ink-mid"
              >
                <Plus size={11} /> To-do 연결
              </button>
            )}
          </div>
        </Field>

        {/* Links */}
        <Field label="Links">
          <div className="flex flex-col gap-1.5">
            {entry.entry_links.map((link) => (
              <div
                key={link.id}
                className="group flex items-start gap-2 rounded-lg border border-line px-2.5 py-1.5"
              >
                <Link2 size={12} className="mt-1 flex-none text-ink-faint" />
                <div className="min-w-0 flex-1">
                  <a
                    href={normalizeUrl(link.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-[12.5px] font-medium text-primary hover:underline"
                  >
                    {link.title}
                  </a>
                  <p className="truncate text-[11px] text-ink-faint">
                    {link.url}
                  </p>
                  {link.memo && (
                    <p className="mt-0.5 text-[11.5px] text-ink-muted">
                      {link.memo}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => report.deleteLink(link.id)}
                  title="링크 삭제"
                  className="flex-none text-ink-faint opacity-0 transition group-hover:opacity-100 hover:text-[#9a3b32]"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            {showLinkForm ? (
              <NewLinkForm
                onCancel={() => setShowLinkForm(false)}
                onCreate={(title, url, memo) => {
                  report.addLink(entry.id, { title, url, memo });
                  setShowLinkForm(false);
                }}
              />
            ) : (
              <button
                onClick={() => setShowLinkForm(true)}
                className="flex w-fit items-center gap-0.5 text-[11.5px] text-ink-faint transition hover:text-ink-mid"
              >
                <Plus size={11} /> 링크 추가
              </button>
            )}
          </div>
        </Field>

        {/* Status */}
        <Field label="Status">
          <div className="flex flex-wrap gap-1">
            {STATUS_KEYS.map((key) => {
              const meta = STATUS_META[key];
              const active = entry.status === key;
              return (
                <button
                  key={key}
                  onClick={() =>
                    report.updateEntry(entry.id, { status: key as EntryStatus })
                  }
                  className="flex items-center gap-1 rounded-md px-2 py-[3px] text-[11.5px] font-medium transition"
                  style={{
                    background: meta.bg,
                    color: meta.fg,
                    outline: active ? `2px solid ${meta.dot}` : "none",
                    outlineOffset: 1,
                    opacity: active ? 1 : 0.75,
                  }}
                >
                  <span
                    className="h-[5px] w-[5px] rounded-full"
                    style={{ background: meta.dot }}
                  />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Tags */}
        <Field label="Tags">
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            onBlur={commitTags}
            onKeyDown={(e) => e.key === "Enter" && commitTags()}
            placeholder="쉼표로 구분 (예: infra, 비용)"
            className="w-full rounded-md border border-line px-2.5 py-1.5 text-[12.5px] text-ink outline-none transition focus:border-primary"
          />
        </Field>
      </div>
    </div>
  );
}

// ---------- 하위 컴포넌트 ----------

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.4px] text-ink-muted">
        {label}
      </p>
      {children}
    </div>
  );
}

export function PanelEmpty({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex h-full min-h-[240px] flex-col items-center justify-center px-6 text-center">
      <p className="mb-1 text-[13.5px] font-medium text-ink-soft">{title}</p>
      <p className="text-[12px] leading-relaxed text-ink-faint">{body}</p>
    </div>
  );
}

function NewProjectForm({
  onCreate,
  onCancel,
}: {
  onCreate: (name: string, org: string, bucket: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [bucket, setBucket] = useState("etc");
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
      {/* Analytics 분류: 이벤트에는 프로젝트명 대신 이 버킷만 전송 (KAN-32) */}
      <select
        value={bucket}
        onChange={(e) => setBucket(e.target.value)}
        title="Analytics 분류 (이벤트에는 프로젝트명 대신 이 값만 전송)"
        className="rounded-md border border-line bg-surface px-2 py-1 text-[12px] outline-none focus:border-primary"
      >
        {ANALYTICS_BUCKET_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            Analytics: {o.label}
          </option>
        ))}
      </select>
      <div className="flex gap-1.5">
        <button
          onClick={() =>
            name.trim() && onCreate(name.trim(), org.trim(), bucket)
          }
          disabled={!name.trim()}
          className="rounded-md bg-primary px-2.5 py-1 text-[11.5px] font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
        >
          만들기
        </button>
        <button
          onClick={onCancel}
          className="rounded-md px-2 py-1 text-[11.5px] text-ink-muted transition hover:bg-line-soft"
        >
          취소
        </button>
      </div>
    </div>
  );
}

function NewLinkForm({
  onCreate,
  onCancel,
}: {
  onCreate: (title: string, url: string, memo?: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [memo, setMemo] = useState("");
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface-alt p-2">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="링크 제목"
        className="rounded-md border border-line px-2 py-1 text-[12px] outline-none focus:border-primary"
      />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="URL (예: https://example.com)"
        className="rounded-md border border-line px-2 py-1 text-[12px] outline-none focus:border-primary"
      />
      <input
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="메모 (선택)"
        className="rounded-md border border-line px-2 py-1 text-[12px] outline-none focus:border-primary"
      />
      <div className="flex gap-1.5">
        <button
          onClick={() =>
            title.trim() &&
            url.trim() &&
            onCreate(title.trim(), url.trim(), memo.trim() || undefined)
          }
          disabled={!title.trim() || !url.trim()}
          className="rounded-md bg-primary px-2.5 py-1 text-[11.5px] font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
        >
          추가
        </button>
        <button
          onClick={onCancel}
          className="rounded-md px-2 py-1 text-[11.5px] text-ink-muted transition hover:bg-line-soft"
        >
          취소
        </button>
      </div>
    </div>
  );
}

function TaskPicker({
  report,
  excludeIds,
  onPick,
  onClose,
}: {
  report: DailyReport;
  excludeIds: string[];
  onPick: (taskId: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const candidates = report.tasks.filter(
    (t) =>
      !excludeIds.includes(t.id) &&
      (!q.trim() || t.title.toLowerCase().includes(q.trim().toLowerCase()))
  );
  return (
    <div className="rounded-lg border border-line bg-surface-alt p-2">
      <div className="mb-1.5 flex items-center gap-1.5">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
          placeholder="To-do 검색"
          className="min-w-0 flex-1 rounded-md border border-line px-2 py-1 text-[12px] outline-none focus:border-primary"
        />
        <button onClick={onClose} className="flex-none text-ink-faint">
          <X size={13} />
        </button>
      </div>
      <div className="max-h-[160px] overflow-y-auto">
        {candidates.length === 0 ? (
          <p className="px-1 py-2 text-[11.5px] text-ink-faint">
            연결할 To-do가 없습니다. To-do 탭에서 먼저 만들어주세요.
          </p>
        ) : (
          candidates.map((t) => (
            <button
              key={t.id}
              onClick={() => onPick(t.id)}
              className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left text-[12.5px] text-ink transition hover:bg-line-soft"
            >
              <span className="min-w-0 flex-1 truncate">{t.title}</span>
              <span className="flex-none text-[10.5px] text-ink-faint">
                {t.list === "today" ? "Today" : "Backlog"}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}
