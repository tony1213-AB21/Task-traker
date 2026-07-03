// Supabase 테이블 행 타입 (supabase/schema.sql과 병렬 유지)

export type TypeKey =
  | "work"
  | "learning_growth"
  | "health_exercise"
  | "meal_life"
  | "sleep_rest"
  | "self_care"
  | "relationship_communication"
  | "leisure_hobby"
  | "finance"
  | "travel_waiting"
  | "other";

export type EntryStatus =
  | "not_started"
  | "in_progress"
  | "done"
  | "paused"
  | "blocked";

export type TaskPriority = "high" | "medium" | "low";

export type TaskList = "today" | "backlog";

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  org_name: string | null;
  status: string;
  color: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subtype {
  id: string;
  user_id: string;
  type_key: TypeKey;
  name: string;
  color: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  list: TaskList;
  priority: TaskPriority;
  status: EntryStatus;
  due_date: string | null;
  estimated_minutes: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Entry {
  id: string;
  user_id: string;
  report_date: string;
  start_at: string;
  end_at: string;
  type_key: TypeKey;
  subtype_id: string | null;
  project_id: string | null;
  content: string | null;
  status: EntryStatus;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface EntryLink {
  id: string;
  user_id: string;
  entry_id: string;
  title: string;
  url: string;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface KptNote {
  id: string;
  user_id: string;
  entry_id: string;
  keep_text: string | null;
  problem_text: string | null;
  try_text: string | null;
  plus_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  user_id: string;
  column_widths: Record<string, number>;
  density: string;
  default_report_date: string | null;
  created_at: string;
  updated_at: string;
}

// 조인 결과 타입
export interface EntryWithRelations extends Entry {
  entry_links: EntryLink[];
  kpt_notes: KptNote[];
  entry_tasks: { task_id: string; tasks: Task | null }[];
}
