"use client";

// 상단 바: 날짜 내비게이션, Tracked/Untracked 요약, 검색, 저장 상태, 기록 추가, 로그아웃

import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogOut,
  Plus,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Entry, Profile } from "@/lib/types/database";
import {
  fmtDateLabel,
  fmtHuman,
  trackedMinutes,
  untrackedMinutes,
} from "@/lib/time/format";

interface TopBarProps {
  date: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  search: string;
  onSearch: (q: string) => void;
  saving: boolean;
  entries: Pick<Entry, "start_at" | "end_at">[];
  userEmail: string | null;
  onAddEntry: () => void;
  // Admin 조회 모드 (KAN-26): admin일 때만 계정 셀렉터 노출
  isAdmin: boolean;
  viewProfiles: Profile[];
  viewUserId: string | null;
  onViewUser: (id: string | null) => void;
}

export default function TopBar({
  date,
  onPrev,
  onNext,
  onToday,
  search,
  onSearch,
  saving,
  entries,
  userEmail,
  onAddEntry,
  isAdmin,
  viewProfiles,
  viewUserId,
  onViewUser,
}: TopBarProps) {
  const router = useRouter();
  const tracked = trackedMinutes(entries);
  const untracked = untrackedMinutes(entries);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <header className="flex flex-none items-center gap-3 border-b border-line bg-surface px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" />
        <span className="text-[14px] font-semibold text-ink-strong">
          Daily Report
        </span>
      </div>

      <div className="ml-2 flex items-center gap-1">
        <button
          onClick={onPrev}
          aria-label="이전 날"
          className="rounded-md p-1 text-ink-muted transition hover:bg-line-soft"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={onToday}
          className="rounded-md px-2 py-1 text-[12px] font-medium text-ink-mid transition hover:bg-line-soft"
        >
          오늘
        </button>
        <button
          onClick={onNext}
          aria-label="다음 날"
          className="rounded-md p-1 text-ink-muted transition hover:bg-line-soft"
        >
          <ChevronRight size={16} />
        </button>
        <span className="ml-1 text-[13.5px] font-semibold text-ink-strong">
          {fmtDateLabel(date)}
        </span>
      </div>

      <div className="ml-3 flex items-center gap-3 text-[12px] text-ink-muted">
        <span>
          Tracked{" "}
          <strong className="font-semibold text-ink">
            {fmtHuman(tracked)}
          </strong>
        </span>
        <span>
          Untracked{" "}
          <span className="font-medium text-[#b07a1e]">
            {fmtHuman(untracked)}
          </span>
        </span>
      </div>

      <div className="relative ml-auto w-[220px]">
        <Search
          size={13}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
        />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="내용, 프로젝트, To-do, 태그 검색"
          className="w-full rounded-lg border border-line bg-surface-alt py-1.5 pl-7 pr-2 text-[12.5px] text-ink outline-none transition focus:border-primary focus:bg-surface focus:shadow-[0_0_0_3px_rgba(94,106,210,0.16)]"
        />
      </div>

      {/* Admin 계정 셀렉터: 어떤 계정의 데이터를 볼지 선택 (조회 전용, KAN-26) */}
      {isAdmin && viewProfiles.length > 0 && (
        <select
          value={viewUserId ?? ""}
          onChange={(e) => onViewUser(e.target.value || null)}
          title="Admin: 조회할 계정 선택"
          className="max-w-[180px] rounded-lg border border-line bg-surface-alt px-2 py-1.5 text-[12px] text-ink outline-none transition focus:border-primary"
        >
          <option value="">내 데이터</option>
          {viewProfiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name || p.email || p.id.slice(0, 8)}
            </option>
          ))}
        </select>
      )}

      <span
        className="flex w-[72px] items-center gap-1 text-[11.5px] text-ink-faint"
        title={saving ? "저장 중" : "모든 변경사항 저장됨"}
      >
        {saving ? (
          <>
            <Loader2 size={12} className="animate-spin" /> 저장 중
          </>
        ) : (
          <>
            <Check size={12} className="text-[#3f9155]" /> 저장됨
          </>
        )}
      </span>

      <button
        onClick={onAddEntry}
        className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-primary-hover"
      >
        <Plus size={14} /> 기록 추가
      </button>

      <button
        onClick={signOut}
        title={userEmail ? `${userEmail} 로그아웃` : "로그아웃"}
        className="rounded-md p-1.5 text-ink-muted transition hover:bg-line-soft"
      >
        <LogOut size={15} />
      </button>
    </header>
  );
}
