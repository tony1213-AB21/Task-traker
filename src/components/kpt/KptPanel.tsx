"use client";

// KPT+ 패널: 선택한 Entry에 귀속되는 회고.
// 하루 요약이 아니라 Entry 단위로 작성한다.

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { DailyReport } from "@/lib/data/useDailyReport";
import type { EntryWithRelations, KptNote } from "@/lib/types/database";
import { fmtHM, fmtTimeRange, minutesBetween } from "@/lib/time/format";
import { TYPE_META } from "@/lib/types/meta";
import { PanelEmpty } from "@/components/right-panel/DetailPanel";

type KptField = "keep_text" | "problem_text" | "try_text" | "plus_text";

const KPT_FIELDS: {
  key: KptField;
  label: string;
  dot: string;
  fg: string;
  placeholder: string;
  isPlus?: boolean;
}[] = [
  {
    key: "keep_text",
    label: "Keep",
    dot: "#3f9155",
    fg: "#2f6b41",
    placeholder: "유지하고 싶은 점을 적어보세요",
  },
  {
    key: "problem_text",
    label: "Problem",
    dot: "#c25c50",
    fg: "#9a3b32",
    placeholder: "아쉬웠던 점·문제를 적어보세요",
  },
  {
    key: "try_text",
    label: "Try",
    dot: "#5e6ad2",
    fg: "#454a78",
    placeholder: "다음에 시도할 것을 적어보세요",
  },
  {
    key: "plus_text",
    label: "Plus",
    dot: "#3f88ab",
    fg: "#2a5f7c",
    placeholder: "떠오른 아이디어를 적어보세요",
    isPlus: true,
  },
];

export default function KptPanel({
  report,
  entry,
}: {
  report: DailyReport;
  entry: EntryWithRelations | null;
}) {
  if (!entry) {
    return (
      <PanelEmpty
        title="선택된 기록이 없습니다"
        body="표에서 행을 선택하면 그 기록에 대한 KPT+를 작성할 수 있습니다."
      />
    );
  }
  return <KptBody key={entry.id} report={report} entry={entry} />;
}

function KptBody({
  report,
  entry,
}: {
  report: DailyReport;
  entry: EntryWithRelations;
}) {
  const kpt: KptNote | undefined = entry.kpt_notes[0];
  const [values, setValues] = useState<Record<KptField, string>>({
    keep_text: kpt?.keep_text ?? "",
    problem_text: kpt?.problem_text ?? "",
    try_text: kpt?.try_text ?? "",
    plus_text: kpt?.plus_text ?? "",
  });
  const [converting, setConverting] = useState(false);
  const [convertedMsg, setConvertedMsg] = useState<string | null>(null);

  const typeMeta = TYPE_META[entry.type_key];
  const index = report.entries.findIndex((e) => e.id === entry.id);

  function commit(field: KptField) {
    const stored = (kpt?.[field] ?? "") as string;
    if (values[field] !== stored) {
      report.saveKpt(entry.id, { [field]: values[field] });
    }
  }

  async function convertPlusToTodo() {
    const text = values.plus_text.trim();
    if (!text) return;
    setConverting(true);
    // Plus 메모 → Backlog To-do (아이디어 인박스)
    const task = await report.createTask({
      title: text.length > 80 ? text.slice(0, 80) : text,
      list: "backlog",
      priority: "medium",
      project_id: entry.project_id,
    });
    setConverting(false);
    if (task) {
      setConvertedMsg(`Backlog에 To-do로 추가했습니다: ${task.title.slice(0, 24)}…`);
      setTimeout(() => setConvertedMsg(null), 4000);
    }
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      {/* 선택 Entry 요약 */}
      <div className="rounded-lg border border-line bg-surface-alt px-3 py-2.5">
        <p className="mb-0.5 text-[11px] font-semibold text-ink-muted">
          Entry #{String(index + 1).padStart(2, "0")} ·{" "}
          {fmtTimeRange(entry.start_at, entry.end_at)} ·{" "}
          {fmtHM(minutesBetween(entry.start_at, entry.end_at))}
        </p>
        <p className="truncate text-[12.5px] text-ink">
          <span
            className="mr-1.5 inline-block rounded px-1.5 py-px text-[11px] font-medium align-[1px]"
            style={{ background: typeMeta.bg, color: typeMeta.fg }}
          >
            {typeMeta.label}
          </span>
          {entry.content || "내용 없음"}
        </p>
        <p className="mt-1.5 text-[11.5px] text-ink-faint">
          선택한 기록에 대한 KPT+를 작성합니다.
        </p>
      </div>

      {KPT_FIELDS.map((f) => (
        <div
          key={f.key}
          className="rounded-[10px] border p-3"
          style={
            f.isPlus
              ? { borderColor: "#dfe6f2", background: "#f7f9fd" }
              : { borderColor: "#eae8e4" }
          }
        >
          <div className="mb-1.5 flex items-center gap-1.5">
            <span
              className="h-[7px] w-[7px] flex-none rounded-[2px]"
              style={{ background: f.dot }}
            />
            <span
              className="text-[12.5px] font-semibold"
              style={{ color: f.fg }}
            >
              {f.label}
            </span>
            {f.isPlus && (
              <button
                onClick={convertPlusToTodo}
                disabled={!values.plus_text.trim() || converting}
                className="ml-auto rounded-md border border-line bg-surface px-2 py-0.5 text-[11px] font-medium text-ink-mid transition hover:bg-line-soft disabled:opacity-40"
              >
                {converting ? "전환 중..." : "To-do로 전환"}
              </button>
            )}
          </div>
          <textarea
            value={values[f.key]}
            onChange={(e) =>
              setValues((v) => ({ ...v, [f.key]: e.target.value }))
            }
            onBlur={() => commit(f.key)}
            placeholder={f.placeholder}
            rows={2}
            className="min-h-[46px] w-full resize-y rounded-md bg-transparent text-[12.5px] leading-relaxed text-ink outline-none placeholder:text-ink-ghost"
          />
          {f.isPlus && convertedMsg && (
            <p className="mt-1 text-[11px] text-[#2a5f7c]">{convertedMsg}</p>
          )}
        </div>
      ))}

      {/* Weekly digest: v1에서는 접힌 placeholder */}
      <button
        className="flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-left text-[12px] text-ink-muted transition hover:bg-surface-alt"
        title="주간 KPT 다이제스트는 다음 버전에서 제공됩니다"
      >
        <ChevronRight size={13} />
        주간 KPT 다이제스트 (준비 중)
      </button>
    </div>
  );
}
