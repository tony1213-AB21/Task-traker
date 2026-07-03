// Type/Status/Priority 표시 메타 (Claude Design 원본의 색상 시스템)

import type { EntryStatus, TaskPriority, TypeKey } from "./database";

export interface PillMeta {
  label: string;
  bg: string;
  fg: string;
  dot: string;
}

// 고정 상위 Type 목록 (v1에서 사용자 변경 불가)
export const TYPE_META: Record<TypeKey, PillMeta> = {
  work: { label: "업무", bg: "#e7edf9", fg: "#31497a", dot: "#4a6cb3" },
  learning_growth: {
    label: "학습/성장",
    bg: "#efe7fb",
    fg: "#5c3d8c",
    dot: "#8a63c9",
  },
  health_exercise: {
    label: "건강/운동",
    bg: "#e0f0e5",
    fg: "#2f6b41",
    dot: "#3f9155",
  },
  meal_life: { label: "식사/생활", bg: "#fbebd9", fg: "#8a5320", dot: "#c9812f" },
  sleep_rest: {
    label: "수면/휴식",
    bg: "#e6e8f4",
    fg: "#454a72",
    dot: "#6a70a8",
  },
  self_care: { label: "자기관리", bg: "#fbe4ee", fg: "#8a3d64", dot: "#c95f92" },
  relationship_communication: {
    label: "관계/소통",
    bg: "#daeeed",
    fg: "#256b66",
    dot: "#3a9690",
  },
  leisure_hobby: {
    label: "여가/취미",
    bg: "#f6edc9",
    fg: "#77621f",
    dot: "#c0a02f",
  },
  finance: { label: "경제/재무", bg: "#dcefe4", fg: "#2a7a55", dot: "#3a9670" },
  travel_waiting: {
    label: "이동/대기",
    bg: "#ddedf7",
    fg: "#2a5f7c",
    dot: "#3f88ab",
  },
  other: { label: "기타", bg: "#ecebe8", fg: "#5a5751", dot: "#8f8a82" },
};

export const TYPE_KEYS = Object.keys(TYPE_META) as TypeKey[];

export const STATUS_META: Record<EntryStatus, PillMeta> = {
  not_started: {
    label: "Not started",
    bg: "#edece9",
    fg: "#6a655e",
    dot: "#a8a39b",
  },
  in_progress: {
    label: "In progress",
    bg: "#e7e8f5",
    fg: "#454a78",
    dot: "#5e6ad2",
  },
  done: { label: "Done", bg: "#e2f0e6", fg: "#2f6b43", dot: "#3f9155" },
  paused: { label: "Paused", bg: "#f6edcf", fg: "#77621f", dot: "#c0a02f" },
  blocked: { label: "Blocked", bg: "#f6e2df", fg: "#9a3b32", dot: "#c25c50" },
};

export const STATUS_KEYS = Object.keys(STATUS_META) as EntryStatus[];

export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; bg: string; fg: string }
> = {
  high: { label: "High", bg: "#f6e2df", fg: "#9a3b32" },
  medium: { label: "Med", bg: "#f6edcf", fg: "#77621f" },
  low: { label: "Low", bg: "#edece9", fg: "#6a655e" },
};

// 프로젝트 색상 기본 팔레트 (새 프로젝트 생성 시 순환)
export const PROJECT_COLORS = [
  "#5e6ad2",
  "#3a9690",
  "#2a7a55",
  "#c9812f",
  "#8a63c9",
  "#c95f92",
  "#3f88ab",
  "#c0a02f",
];
