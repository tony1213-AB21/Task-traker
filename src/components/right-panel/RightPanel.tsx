"use client";

// 오른쪽 컨텍스트 패널: Detail / KPT+ / To-do / Analysis / Projects 탭.
// 행 선택 시 컨텍스트가 갱신되고, 탭 상태는 선택 변경과 무관하게 유지된다.

import {
  BarChart3,
  FileText,
  FolderKanban,
  ListChecks,
  Sparkles,
} from "lucide-react";
import type { DailyReport } from "@/lib/data/useDailyReport";
import type { EntryWithRelations } from "@/lib/types/database";
import DetailPanel from "./DetailPanel";
import KptPanel from "@/components/kpt/KptPanel";
import TodoPanel from "@/components/todo/TodoPanel";
import AnalysisPanel from "@/components/analysis/AnalysisPanel";
import ProjectsPanel from "@/components/projects/ProjectsPanel";

export type RightPanelTab = "detail" | "kpt" | "todo" | "analysis" | "projects";

const TABS: { key: RightPanelTab; label: string; icon: React.ReactNode }[] = [
  { key: "detail", label: "Detail", icon: <FileText size={16} /> },
  { key: "kpt", label: "KPT+", icon: <Sparkles size={16} /> },
  { key: "todo", label: "To-do", icon: <ListChecks size={16} /> },
  { key: "analysis", label: "Analysis", icon: <BarChart3 size={16} /> },
  { key: "projects", label: "Projects", icon: <FolderKanban size={16} /> },
];

interface RightPanelProps {
  tab: RightPanelTab;
  onTab: (tab: RightPanelTab) => void;
  report: DailyReport;
  date: string;
  selectedEntry: EntryWithRelations | null;
  overlaps: Map<string, EntryWithRelations[]>;
  onSelectEntry: (id: string) => void;
}

export default function RightPanel({
  tab,
  onTab,
  report,
  date,
  selectedEntry,
  overlaps,
  onSelectEntry,
}: RightPanelProps) {
  return (
    <aside className="flex flex-none">
      {/* 패널 본문 */}
      <div className="flex w-[336px] flex-col overflow-hidden border-l border-line bg-surface">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {tab === "detail" && (
            <DetailPanel
              report={report}
              entry={selectedEntry}
              overlaps={overlaps}
            />
          )}
          {tab === "kpt" && (
            <KptPanel report={report} entry={selectedEntry} />
          )}
          {tab === "todo" && (
            <TodoPanel report={report} selectedEntry={selectedEntry} />
          )}
          {tab === "analysis" && <AnalysisPanel report={report} date={date} />}
          {tab === "projects" && (
            <ProjectsPanel
              report={report}
              date={date}
              onSelectEntry={onSelectEntry}
            />
          )}
        </div>
      </div>

      {/* 오른쪽 레일 탭 */}
      <nav className="flex w-[54px] flex-none flex-col border-l border-line bg-surface-alt">
        {TABS.map(({ key, label, icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => onTab(key)}
              className="relative flex w-full flex-col items-center gap-[5px] px-1 py-[11px] text-[9px] font-semibold tracking-[0.2px] transition"
              style={{ color: active ? "#5e6ad2" : "#8f8a82" }}
            >
              <span
                className="absolute bottom-[9px] right-0 top-[9px] w-[2px] rounded"
                style={{ background: active ? "#5e6ad2" : "transparent" }}
              />
              {icon}
              {label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
