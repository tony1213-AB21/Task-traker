// Type/Status/Priority pill과 Project/To-do 참조 칩 (디자인 원본 기준)

import type {
  EntryStatus,
  Project,
  TaskPriority,
  TypeKey,
} from "@/lib/types/database";
import { PRIORITY_META, STATUS_META, TYPE_META } from "@/lib/types/meta";

export function TypePill({ typeKey }: { typeKey: TypeKey }) {
  const meta = TYPE_META[typeKey] ?? TYPE_META.other;
  return (
    <span
      className="inline-flex max-w-full items-center gap-[5px] whitespace-nowrap rounded-md px-2 py-[2px] text-[12px] font-medium leading-normal"
      style={{ background: meta.bg, color: meta.fg }}
    >
      {meta.label}
    </span>
  );
}

export function StatusPill({ status }: { status: EntryStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.not_started;
  return (
    <span
      className="inline-flex max-w-full items-center gap-[5px] whitespace-nowrap rounded-md px-2 py-[2px] text-[12px] font-medium leading-normal"
      style={{ background: meta.bg, color: meta.fg }}
    >
      <span
        className="h-[6px] w-[6px] flex-none rounded-full"
        style={{ background: meta.dot }}
      />
      {meta.label}
    </span>
  );
}

export function PrioPill({ priority }: { priority: TaskPriority }) {
  const meta = PRIORITY_META[priority] ?? PRIORITY_META.medium;
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-px text-[11px] font-medium"
      style={{ background: meta.bg, color: meta.fg }}
    >
      {meta.label}
    </span>
  );
}

export function SubtypeChip({ name }: { name: string }) {
  return (
    <span className="inline-flex max-w-full items-center whitespace-nowrap rounded-md border border-line bg-surface-alt px-1.5 py-px text-[12px] text-ink-soft">
      {name}
    </span>
  );
}

export function ProjectChip({
  project,
  className,
}: {
  project: Project | null | undefined;
  className?: string;
}) {
  if (!project) {
    return (
      <span className={`text-[12.5px] text-ink-faint ${className ?? ""}`}>
        프로젝트 없음
      </span>
    );
  }
  return (
    <span
      className={`inline-flex max-w-full items-center gap-[6px] whitespace-nowrap rounded-md border border-line bg-surface px-1.5 py-px text-[12px] text-ink-mid ${className ?? ""}`}
    >
      <span
        className="h-[7px] w-[7px] flex-none rounded-full"
        style={{ background: project.color ?? "#8f8a82" }}
      />
      <span className="truncate">{project.name}</span>
    </span>
  );
}

export function TodoChip({
  title,
  done,
}: {
  title: string;
  done: boolean;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-[5px] whitespace-nowrap text-[12.5px]">
      <span
        className={`inline-flex h-[13px] w-[13px] flex-none items-center justify-center rounded-[4px] border text-[9px] ${
          done
            ? "border-[#3f9155] bg-[#3f9155] text-white"
            : "border-line-strong bg-surface"
        }`}
      >
        {done ? "✓" : ""}
      </span>
      <span
        className={`truncate ${
          done ? "text-ink-faint line-through" : "text-ink-mid"
        }`}
      >
        {title}
      </span>
    </span>
  );
}
