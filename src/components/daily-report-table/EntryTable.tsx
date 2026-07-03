"use client";

// Daily Report 메인 표.
// TanStack Table 기반: 컬럼 리사이즈(드래그), 더블클릭 auto-fit, 폭 저장,
// 촘촘한 행 밀도, 선택 상태, 겹침 경고, 링크 개수 표시, Tags 토글.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnSizingState,
} from "@tanstack/react-table";
import { AlertTriangle, Link2, Plus } from "lucide-react";
import type { DailyReport } from "@/lib/data/useDailyReport";
import type { EntryWithRelations } from "@/lib/types/database";
import { STATUS_META, TYPE_META, TYPE_KEYS, STATUS_KEYS } from "@/lib/types/meta";
import {
  fmtDayHeading,
  fmtHM,
  fmtHuman,
  fmtTimeRange,
  minutesBetween,
  toLocalHM,
  trackedMinutes,
} from "@/lib/time/format";
import {
  ProjectChip,
  StatusPill,
  SubtypeChip,
  TodoChip,
  TypePill,
} from "@/components/ui/pills";

const DEFAULT_WIDTHS: Record<string, number> = {
  num: 44,
  time: 96,
  dur: 66,
  type: 118,
  subtype: 98,
  proj: 138,
  todo: 132,
  status: 100,
  tags: 120,
};

const MIN_WIDTH = 54;

interface EntryTableProps {
  date: string;
  report: DailyReport;
  entries: EntryWithRelations[];
  overlaps: Map<string, EntryWithRelations[]>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchActive: boolean;
}

export default function EntryTable({
  date,
  report,
  entries,
  overlaps,
  selectedId,
  onSelect,
  searchActive,
}: EntryTableProps) {
  const [showTags, setShowTags] = useState(false);
  const [openMenu, setOpenMenu] = useState<{
    entryId: string;
    kind: "type" | "status";
  } | null>(null);

  const projectById = useMemo(
    () => new Map(report.projects.map((p) => [p.id, p])),
    [report.projects]
  );
  const subtypeById = useMemo(
    () => new Map(report.subtypes.map((s) => [s.id, s])),
    [report.subtypes]
  );

  // 컬럼 폭: 저장된 사용자 설정 + 기본값
  const [sizing, setSizing] = useState<ColumnSizingState>({});
  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    if (report.loading) return;
    setSizing({ ...DEFAULT_WIDTHS, ...report.columnWidths });
    loadedRef.current = true;
  }, [report.loading, report.columnWidths]);

  const columnHelper = createColumnHelper<EntryWithRelations>();

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "num",
        header: "#",
        size: DEFAULT_WIDTHS.num,
        cell: (info) => (
          <span className="tabular-nums text-[11px] text-ink-ghost">
            {String(info.row.index + 1).padStart(2, "0")}
          </span>
        ),
      }),
      columnHelper.display({
        id: "time",
        header: "Time",
        size: DEFAULT_WIDTHS.time,
        cell: (info) => (
          <span className="tabular-nums text-[13px] text-ink-mid">
            {fmtTimeRange(info.row.original.start_at, info.row.original.end_at)}
          </span>
        ),
      }),
      columnHelper.display({
        id: "dur",
        header: "Duration",
        size: DEFAULT_WIDTHS.dur,
        cell: (info) => (
          <span className="block text-right tabular-nums text-[13px] text-ink-mid">
            {fmtHM(
              minutesBetween(
                info.row.original.start_at,
                info.row.original.end_at
              )
            )}
          </span>
        ),
      }),
      columnHelper.display({
        id: "type",
        header: "Type",
        size: DEFAULT_WIDTHS.type,
        cell: (info) => {
          const e = info.row.original;
          return (
            <button
              className="relative block max-w-full"
              onClick={(ev) => {
                ev.stopPropagation();
                onSelect(e.id);
                setOpenMenu((cur) =>
                  cur?.entryId === e.id && cur.kind === "type"
                    ? null
                    : { entryId: e.id, kind: "type" }
                );
              }}
            >
              <TypePill typeKey={e.type_key} />
            </button>
          );
        },
      }),
      columnHelper.display({
        id: "subtype",
        header: "Subtype",
        size: DEFAULT_WIDTHS.subtype,
        cell: (info) => {
          const st = info.row.original.subtype_id
            ? subtypeById.get(info.row.original.subtype_id)
            : null;
          return st ? (
            <SubtypeChip name={st.name} />
          ) : (
            <span className="text-[12px] text-ink-ghost">—</span>
          );
        },
      }),
      columnHelper.display({
        id: "proj",
        header: "Project",
        size: DEFAULT_WIDTHS.proj,
        cell: (info) => {
          const p = info.row.original.project_id
            ? projectById.get(info.row.original.project_id)
            : null;
          return p ? (
            <ProjectChip project={p} />
          ) : (
            <span className="text-[12px] text-ink-ghost">—</span>
          );
        },
      }),
      columnHelper.display({
        id: "content",
        header: "Content",
        cell: (info) => {
          const e = info.row.original;
          const warn = overlaps.get(e.id);
          return (
            <span className="flex min-w-0 items-center gap-1.5">
              {warn && warn.length > 0 && (
                <span title={overlapMessage(e, warn)}>
                  <AlertTriangle
                    size={13}
                    className="flex-none text-[#b07a1e]"
                  />
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                {e.content || (
                  <span className="text-ink-ghost">내용 없음</span>
                )}
              </span>
              {e.entry_links.length > 0 && (
                <span
                  className="flex flex-none items-center gap-0.5 text-[11px] text-ink-faint"
                  title={`링크 ${e.entry_links.length}개`}
                >
                  <Link2 size={12} />
                  {e.entry_links.length}
                </span>
              )}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "todo",
        header: "Related To-do",
        size: DEFAULT_WIDTHS.todo,
        cell: (info) => {
          const et = info.row.original.entry_tasks[0];
          return et?.tasks ? (
            <TodoChip title={et.tasks.title} done={et.tasks.status === "done"} />
          ) : (
            <span className="text-[12px] text-ink-ghost">—</span>
          );
        },
      }),
      columnHelper.display({
        id: "status",
        header: "Status",
        size: DEFAULT_WIDTHS.status,
        cell: (info) => {
          const e = info.row.original;
          return (
            <button
              className="relative block max-w-full"
              onClick={(ev) => {
                ev.stopPropagation();
                onSelect(e.id);
                setOpenMenu((cur) =>
                  cur?.entryId === e.id && cur.kind === "status"
                    ? null
                    : { entryId: e.id, kind: "status" }
                );
              }}
            >
              <StatusPill status={e.status} />
            </button>
          );
        },
      }),
      ...(showTags
        ? [
            columnHelper.display({
              id: "tags",
              header: "Tags",
              size: DEFAULT_WIDTHS.tags,
              cell: (info) => (
                <span className="flex flex-wrap gap-1">
                  {info.row.original.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-line-soft px-1.5 py-px text-[11px] text-ink-soft"
                    >
                      {t}
                    </span>
                  ))}
                </span>
              ),
            }),
          ]
        : []),
    ],
    [columnHelper, showTags, subtypeById, projectById, overlaps, onSelect]
  );

  const table = useReactTable({
    data: entries,
    columns,
    state: { columnSizing: sizing },
    onColumnSizingChange: (updater) => {
      setSizing((old) => {
        const next = typeof updater === "function" ? updater(old) : updater;
        report.saveColumnWidths(next as Record<string, number>);
        return next;
      });
    },
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    getCoreRowModel: getCoreRowModel(),
    defaultColumn: { minSize: MIN_WIDTH, size: 150 },
  });

  // 더블클릭 auto-fit: 보이는 내용 기준으로 폭 계산 (Google Sheets 방식)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  function autofit(colId: string) {
    if (colId === "content" || colId === "num") return;
    const canvas =
      canvasRef.current ?? (canvasRef.current = document.createElement("canvas"));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.font = "600 11.5px Inter, sans-serif";
    const headerLabels: Record<string, string> = {
      time: "Time",
      dur: "Duration",
      type: "Type",
      subtype: "Subtype",
      proj: "Project",
      todo: "Related To-do",
      status: "Status",
      tags: "Tags",
    };
    let max = ctx.measureText(headerLabels[colId] ?? "").width + 18;
    ctx.font = "13px Inter, sans-serif";
    for (const e of entries) {
      const text = cellText(colId, e);
      const w = ctx.measureText(text).width;
      if (w > max) max = w;
    }
    let pad = 26;
    if (colId === "type") pad += 22;
    if (colId === "proj" || colId === "todo") pad += 20;
    if (colId === "status") pad += 16;
    const next = {
      ...table.getState().columnSizing,
      [colId]: Math.max(MIN_WIDTH, Math.round(max + pad)),
    };
    setSizing(next);
    report.saveColumnWidths(next as Record<string, number>);
  }

  function cellText(colId: string, e: EntryWithRelations): string {
    switch (colId) {
      case "time":
        return `${toLocalHM(e.start_at)}–${toLocalHM(e.end_at)}`;
      case "dur":
        return fmtHM(minutesBetween(e.start_at, e.end_at));
      case "type":
        return TYPE_META[e.type_key]?.label ?? "";
      case "subtype":
        return e.subtype_id ? (subtypeById.get(e.subtype_id)?.name ?? "") : "";
      case "proj":
        return e.project_id ? (projectById.get(e.project_id)?.name ?? "") : "";
      case "todo":
        return e.entry_tasks[0]?.tasks?.title ?? "";
      case "status":
        return STATUS_META[e.status]?.label ?? "";
      case "tags":
        return e.tags.join(" ");
      default:
        return "";
    }
  }

  const tracked = trackedMinutes(report.entries);

  // ---------- 상태별 화면 ----------

  if (report.error) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-line bg-surface">
        <p className="mb-3 text-[13.5px] text-ink-soft">{report.error}</p>
        <button
          onClick={() => report.refetch()}
          className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-ink-mid transition hover:bg-line-soft"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface"
      onClick={() => setOpenMenu(null)}
    >
      {/* Sticky day divider */}
      <div className="flex flex-none items-center gap-3 border-b border-line-strong bg-surface-alt px-3.5 py-2">
        <h2 className="text-[13px] font-semibold text-ink-strong">
          {fmtDayHeading(date)}
        </h2>
        <span className="text-[11.5px] text-ink-muted">
          {report.entries.length}개 기록 · {fmtHuman(tracked)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowTags((v) => !v);
          }}
          className="ml-auto rounded-md border border-line px-2 py-1 text-[11.5px] text-ink-muted transition hover:bg-line-soft"
        >
          {showTags ? "Tags 숨기기" : "Tags 보기"}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {report.loading ? (
          <TableSkeleton />
        ) : entries.length === 0 ? (
          <EmptyState
            searchActive={searchActive}
            onAdd={async () => {
              const created = await report.createEntry({
                startHM: "09:00",
                endHM: "09:30",
              });
              if (created) onSelect(created.id);
            }}
          />
        ) : (
          <table
            className="w-full border-collapse"
            style={{ tableLayout: "fixed", minWidth: table.getTotalSize() }}
          >
            <colgroup>
              {table.getFlatHeaders().map((header) => (
                <col
                  key={header.id}
                  style={{
                    width:
                      header.column.id === "content"
                        ? undefined
                        : header.getSize(),
                  }}
                />
              ))}
            </colgroup>
            <thead>
              <tr>
                {table.getFlatHeaders().map((header) => (
                  <th
                    key={header.id}
                    className="sticky top-0 z-[6] whitespace-nowrap border-b border-line-strong border-r border-r-line-faint bg-surface-alt px-2.5 py-2 text-left text-[11.5px] font-semibold text-ink-muted last:border-r-0"
                    style={
                      header.column.id === "dur"
                        ? { textAlign: "right" }
                        : undefined
                    }
                  >
                    <span className="relative block">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.id !== "num" &&
                        header.column.id !== "content" && (
                          <span
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            onDoubleClick={() => autofit(header.column.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute -right-3 top-1/2 z-[7] h-6 w-2 -translate-y-1/2 cursor-col-resize select-none rounded hover:bg-[rgba(94,106,210,0.18)]"
                            title="드래그: 폭 조절 · 더블클릭: 자동 맞춤"
                          />
                        )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => {
                const e = row.original;
                const selected = e.id === selectedId;
                return (
                  <tr
                    key={e.id}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setOpenMenu(null);
                      onSelect(e.id);
                    }}
                    className={`group cursor-pointer transition-colors ${
                      selected ? "bg-row-selected" : "bg-surface hover:bg-surface-alt"
                    }`}
                  >
                    {row.getVisibleCells().map((cell, ci) => (
                      <td
                        key={cell.id}
                        className={`relative h-9 border-b border-line-soft border-r border-r-line-faint px-2.5 py-1.5 align-middle last:border-r-0 ${
                          ci === 0 ? "text-center" : ""
                        }`}
                      >
                        {ci === 0 && (
                          <span
                            className="absolute bottom-0 left-0 top-0 w-[2px]"
                            style={{
                              background: selected ? "#5e6ad2" : "transparent",
                            }}
                          />
                        )}
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        {/* Type/Status 인라인 메뉴 */}
                        {openMenu?.entryId === e.id &&
                          ((openMenu.kind === "type" &&
                            cell.column.id === "type") ||
                            (openMenu.kind === "status" &&
                              cell.column.id === "status")) && (
                            <InlineMenu
                              kind={openMenu.kind}
                              onPick={(value) => {
                                setOpenMenu(null);
                                if (openMenu.kind === "type") {
                                  report.updateEntry(e.id, {
                                    type_key: value as EntryWithRelations["type_key"],
                                    subtype_id: null,
                                  });
                                } else {
                                  report.updateEntry(e.id, {
                                    status: value as EntryWithRelations["status"],
                                  });
                                }
                              }}
                            />
                          )}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {/* 하단 빈 행 + 새 기록 행 */}
              {[0, 1, 2].map((i) => (
                <tr key={`empty-${i}`}>
                  {table.getFlatHeaders().map((h) => (
                    <td
                      key={h.id}
                      className="h-9 border-b border-line-soft border-r border-r-line-faint last:border-r-0"
                    />
                  ))}
                </tr>
              ))}
              <tr>
                <td colSpan={table.getFlatHeaders().length} className="p-0">
                  <button
                    onClick={async (ev) => {
                      ev.stopPropagation();
                      const last = report.entries[report.entries.length - 1];
                      const start = last ? new Date(last.end_at) : new Date();
                      const end = new Date(start.getTime() + 30 * 60000);
                      const hm = (d: Date) =>
                        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                      const created = await report.createEntry({
                        startHM: hm(start),
                        endHM: hm(end),
                      });
                      if (created) onSelect(created.id);
                    }}
                    className="flex w-full items-center gap-1.5 px-3 py-2 text-[12.5px] text-ink-faint transition hover:bg-surface-alt hover:text-ink-mid"
                  >
                    <Plus size={13} /> 새 기록 추가
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function overlapMessage(
  e: EntryWithRelations,
  others: EntryWithRelations[]
): string {
  const o = others[0];
  const range = fmtTimeRange(o.start_at, o.end_at);
  const label = o.content ? `“${truncate(o.content, 20)}”` : "다른 기록";
  return `이 기록은 ${range} ${label}과 시간이 겹칩니다. 그래도 저장할 수 있습니다.`;
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function InlineMenu({
  kind,
  onPick,
}: {
  kind: "type" | "status";
  onPick: (value: string) => void;
}) {
  return (
    <div
      className="absolute left-2 top-8 z-20 min-w-[150px] rounded-lg border border-line bg-surface py-1 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
      onClick={(e) => e.stopPropagation()}
    >
      {(kind === "type" ? TYPE_KEYS : STATUS_KEYS).map((key) => {
        const meta =
          kind === "type"
            ? TYPE_META[key as keyof typeof TYPE_META]
            : STATUS_META[key as keyof typeof STATUS_META];
        return (
          <button
            key={key}
            onClick={() => onPick(key)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px] text-ink transition hover:bg-line-soft"
          >
            <span
              className="h-[9px] w-[9px] flex-none rounded-sm"
              style={{ background: meta.dot }}
            />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="p-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="mb-2 h-8 animate-pulse rounded-md bg-line-soft"
          style={{ opacity: 1 - i * 0.08 }}
        />
      ))}
    </div>
  );
}

function EmptyState({
  searchActive,
  onAdd,
}: {
  searchActive: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex h-full min-h-[300px] flex-col items-center justify-center px-6 text-center">
      {searchActive ? (
        <>
          <p className="mb-1 text-[14px] font-medium text-ink-soft">
            검색 결과가 없습니다
          </p>
          <p className="text-[12.5px] text-ink-faint">
            다른 키워드로 검색해보세요.
          </p>
        </>
      ) : (
        <>
          <p className="mb-1 text-[14px] font-medium text-ink-soft">
            아직 기록이 없습니다
          </p>
          <p className="mb-4 text-[12.5px] text-ink-faint">
            오늘 실제로 시간을 쓴 일을 기록해보세요.
          </p>
          <button
            onClick={onAdd}
            className="flex items-center gap-1 rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-semibold text-white transition hover:bg-primary-hover"
          >
            <Plus size={14} /> 첫 기록 추가
          </button>
        </>
      )}
    </div>
  );
}
