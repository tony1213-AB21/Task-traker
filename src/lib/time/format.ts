// 시간/기간 계산과 표시 유틸

import { differenceInMinutes, format, parse } from "date-fns";
import { ko } from "date-fns/locale";
import type { Entry } from "@/lib/types/database";

/** 분 → "HH:MM" (표 안 Duration 표기) */
export function fmtHM(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** 분 → "13h 35m" (요약/Analysis 카드 표기) */
export function fmtHuman(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h === 0) return `${mm}m`;
  if (mm === 0) return `${h}h`;
  return `${h}h ${mm}m`;
}

export function minutesBetween(startIso: string, endIso: string): number {
  return differenceInMinutes(new Date(endIso), new Date(startIso));
}

/** ISO → 로컬 "HH:mm" */
export function toLocalHM(iso: string): string {
  return format(new Date(iso), "HH:mm");
}

/** ISO 쌍 → "09:45–11:15" */
export function fmtTimeRange(startIso: string, endIso: string): string {
  return `${toLocalHM(startIso)}–${toLocalHM(endIso)}`;
}

/** "yyyy-MM-dd" + "HH:mm" → 로컬 타임존 Date */
export function combineDateTime(dateStr: string, hm: string): Date {
  return parse(`${dateStr} ${hm}`, "yyyy-MM-dd HH:mm", new Date());
}

/** 상단 날짜 라벨: "2026. 7. 3. (금)" — 요일은 라이브러리로 계산 */
export function fmtDateLabel(dateStr: string): string {
  const d = parse(dateStr, "yyyy-MM-dd", new Date());
  return format(d, "yyyy. M. d. (EEEEE)", { locale: ko });
}

/** 짧은 날짜 라벨: "7월 3일 금요일" */
export function fmtDayHeading(dateStr: string): string {
  const d = parse(dateStr, "yyyy-MM-dd", new Date());
  return format(d, "M월 d일 EEEE", { locale: ko });
}

export function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

interface Interval {
  start: number;
  end: number;
}

function toIntervals(entries: Pick<Entry, "start_at" | "end_at">[]): Interval[] {
  return entries
    .map((e) => ({
      start: new Date(e.start_at).getTime(),
      end: new Date(e.end_at).getTime(),
    }))
    .filter((iv) => iv.end > iv.start)
    .sort((a, b) => a.start - b.start);
}

/** 두 구간 겹침 여부 */
export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return (
    new Date(aStart).getTime() < new Date(bEnd).getTime() &&
    new Date(bStart).getTime() < new Date(aEnd).getTime()
  );
}

/**
 * 같은 날짜 Entry들 사이의 겹침 검출.
 * entryId → 겹치는 상대 Entry 목록
 */
export function findOverlaps<T extends Pick<Entry, "id" | "start_at" | "end_at">>(
  entries: T[]
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (let i = 0; i < entries.length; i++) {
    for (let j = 0; j < entries.length; j++) {
      if (i === j) continue;
      const a = entries[i];
      const b = entries[j];
      if (rangesOverlap(a.start_at, a.end_at, b.start_at, b.end_at)) {
        const list = map.get(a.id) ?? [];
        list.push(b);
        map.set(a.id, list);
      }
    }
  }
  return map;
}

/** 기록된 총 시간(분) — 겹침은 한 번만 계산(구간 합집합) */
export function trackedMinutes(
  entries: Pick<Entry, "start_at" | "end_at">[]
): number {
  const ivs = toIntervals(entries);
  if (ivs.length === 0) return 0;
  let total = 0;
  let curStart = ivs[0].start;
  let curEnd = ivs[0].end;
  for (const iv of ivs.slice(1)) {
    if (iv.start <= curEnd) {
      curEnd = Math.max(curEnd, iv.end);
    } else {
      total += curEnd - curStart;
      curStart = iv.start;
      curEnd = iv.end;
    }
  }
  total += curEnd - curStart;
  return Math.round(total / 60000);
}

/**
 * Untracked = 첫 기록 시작과 마지막 기록 종료 사이의 빈 시간.
 * 24시간 전체 기준이 아니라 gap rule을 사용한다.
 */
export function untrackedMinutes(
  entries: Pick<Entry, "start_at" | "end_at">[]
): number {
  const ivs = toIntervals(entries);
  if (ivs.length === 0) return 0;
  const earliest = ivs[0].start;
  const latest = Math.max(...ivs.map((iv) => iv.end));
  const span = Math.round((latest - earliest) / 60000);
  return Math.max(0, span - trackedMinutes(entries));
}
