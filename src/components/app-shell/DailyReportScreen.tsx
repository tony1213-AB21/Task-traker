"use client";

// Daily Report 메인 화면: 상단 바 + 중앙 표 + 오른쪽 컨텍스트 패널.
// 날짜/선택 Entry/패널 탭/검색 상태를 소유한다.

import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, format, parse } from "date-fns";
import { useDailyReport } from "@/lib/data/useDailyReport";
import { track } from "@/lib/analytics/track";
import { findOverlaps, todayStr } from "@/lib/time/format";
import TopBar from "./TopBar";
import EntryTable from "@/components/daily-report-table/EntryTable";
import RightPanel, {
  type RightPanelTab,
} from "@/components/right-panel/RightPanel";

export default function DailyReportScreen() {
  const [date, setDate] = useState(todayStr());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<RightPanelTab>("detail");
  const [search, setSearch] = useState("");

  const report = useDailyReport(date);

  // login_completed: OAuth 콜백이 붙인 ?login=1을 감지해 1회 발화 후 제거 (KAN-13)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "1") {
      track("login_completed");
      params.delete("login");
      const qs = params.toString();
      window.history.replaceState(
        null,
        "",
        window.location.pathname + (qs ? `?${qs}` : "")
      );
    }
  }, []);

  // daily_report_viewed: 메인 표 렌더 완료(첫 로딩 종료) 시 1회 발화 (KAN-13)
  const viewedFired = useRef(false);
  useEffect(() => {
    if (!report.loading && !viewedFired.current) {
      viewedFired.current = true;
      track("daily_report_viewed");
    }
  }, [report.loading]);

  const projectById = useMemo(
    () => new Map(report.projects.map((p) => [p.id, p])),
    [report.projects]
  );

  // 검색: content, 프로젝트명, 연결 To-do 제목, 태그
  const visibleEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return report.entries;
    return report.entries.filter((e) => {
      if (e.content?.toLowerCase().includes(q)) return true;
      const project = e.project_id ? projectById.get(e.project_id) : null;
      if (project?.name.toLowerCase().includes(q)) return true;
      if (
        e.entry_tasks.some((et) =>
          et.tasks?.title.toLowerCase().includes(q)
        )
      )
        return true;
      if (e.tags.some((t) => t.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [report.entries, search, projectById]);

  const overlaps = useMemo(
    () => findOverlaps(report.entries),
    [report.entries]
  );

  const selectedEntry =
    report.entries.find((e) => e.id === selectedId) ?? null;

  function moveDate(delta: number) {
    const d = parse(date, "yyyy-MM-dd", new Date());
    setDate(format(addDays(d, delta), "yyyy-MM-dd"));
    setSelectedId(null);
  }

  function selectEntry(id: string) {
    setSelectedId(id);
    // Detail/KPT 등 컨텍스트 탭은 유지하고 컨텍스트만 갱신 (디자인 기준)
  }

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <TopBar
        date={date}
        onPrev={() => moveDate(-1)}
        onNext={() => moveDate(1)}
        onToday={() => {
          setDate(todayStr());
          setSelectedId(null);
        }}
        search={search}
        onSearch={setSearch}
        saving={report.saving}
        entries={report.entries}
        userEmail={report.userEmail}
        onAddEntry={async () => {
          const created = await report.createEntry(defaultTimes(report));
          if (created) {
            setSelectedId(created.id);
            setTab("detail");
          }
        }}
      />
      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 overflow-hidden p-3 pr-0">
          <EntryTable
            date={date}
            report={report}
            entries={visibleEntries}
            overlaps={overlaps}
            selectedId={selectedId}
            onSelect={selectEntry}
            searchActive={search.trim().length > 0}
            onPrevDay={() => moveDate(-1)}
            onNextDay={() => moveDate(1)}
          />
        </main>
        <RightPanel
          tab={tab}
          onTab={setTab}
          report={report}
          date={date}
          selectedEntry={selectedEntry}
          overlaps={overlaps}
          onSelectEntry={selectEntry}
        />
      </div>
    </div>
  );
}

// 새 Entry 기본 시간: 마지막 기록의 종료 시각부터 30분, 없으면 지금부터 30분
function defaultTimes(report: { entries: { end_at: string }[] }) {
  const last = report.entries[report.entries.length - 1];
  const start = last ? new Date(last.end_at) : new Date();
  const end = new Date(start.getTime() + 30 * 60000);
  const hm = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return { startHM: hm(start), endHM: hm(end) };
}
