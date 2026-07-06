"use client";

// Daily Report 화면의 데이터 상태와 CRUD.
// 선택 날짜의 Entry(+링크/KPT/To-do 연결), 전체 Task/Project/Subtype,
// 사용자 환경설정(컬럼 폭)을 관리한다. 변경은 낙관적으로 반영하고 실패 시 재조회한다.

import { useCallback, useEffect, useRef, useState } from "react";
import { addDays, format, parse } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import type {
  Entry,
  EntryLink,
  EntryWithRelations,
  KptNote,
  Profile,
  Project,
  Subtype,
  Task,
  TaskList,
  TaskPriority,
  TypeKey,
} from "@/lib/types/database";
import { PROJECT_COLORS } from "@/lib/types/meta";
import { combineDateTime } from "@/lib/time/format";
import {
  durationBucket,
  track,
  workTypeFromSubtype,
  type ProjectType,
} from "@/lib/analytics/track";

const ENTRY_SELECT =
  "*, entry_links(*), kpt_notes(*), entry_tasks(task_id, tasks(*))";

function sortEntries(list: EntryWithRelations[]): EntryWithRelations[] {
  return [...list].sort(
    (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
  );
}

// 소프트 삭제된 연결 데이터는 조인 결과에서 숨긴다 (DB 행은 유지, KAN-23).
function normalizeEntries(list: EntryWithRelations[]): EntryWithRelations[] {
  return list.map((e) => ({
    ...e,
    entry_tasks: e.entry_tasks.filter((et) => !et.tasks?.deleted_at),
    kpt_notes: e.kpt_notes.filter((k) => !k.deleted_at),
  }));
}

export interface CreateEntryInput {
  startHM: string;
  endHM: string;
  type_key?: TypeKey;
  content?: string;
}

export interface AdjacentDaySummary {
  date: string;
  count: number;
  entries: Pick<Entry, "start_at" | "end_at">[];
}

export interface CreateTaskInput {
  title: string;
  list?: TaskList;
  priority?: TaskPriority;
  project_id?: string | null;
  due_date?: string | null;
  estimated_minutes?: number | null;
}

// viewUserId: Admin이 다른 계정의 데이터를 조회할 때 그 계정의 user_id (KAN-26, 조회 전용).
// 쓰기 정책은 소유자 전용이라 조회 모드에서의 수정 시도는 DB가 거부하고 recover()가 화면을 되돌린다.
export function useDailyReport(date: string, viewUserId: string | null = null) {
  const supabase = useRef(createClient()).current;
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewProfiles, setViewProfiles] = useState<Profile[]>([]);

  const [entries, setEntries] = useState<EntryWithRelations[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [subtypes, setSubtypes] = useState<Subtype[]>([]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [adjacentDays, setAdjacentDays] = useState<{
    prev: AdjacentDaySummary;
    next: AdjacentDaySummary;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingOps, setPendingOps] = useState(0);

  const beginOp = useCallback(() => setPendingOps((n) => n + 1), []);
  const endOp = useCallback(() => setPendingOps((n) => n - 1), []);

  // ---------- 조회 ----------

  const fetchEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from("entries")
      .select(ENTRY_SELECT)
      .eq("report_date", date)
      .order("start_at", { ascending: true });
    if (error) throw error;
    setEntries(normalizeEntries((data ?? []) as unknown as EntryWithRelations[]));
  }, [supabase, date]);

  const fetchAll = useCallback(async () => {
    setError(null);
    const d = parse(date, "yyyy-MM-dd", new Date());
    const prevDate = format(addDays(d, -1), "yyyy-MM-dd");
    const nextDate = format(addDays(d, 1), "yyyy-MM-dd");
    try {
      // 사용자/admin 여부를 먼저 확정해야 조회 대상(target)을 정할 수 있다 (KAN-26)
      const userRes = await supabase.auth.getUser();
      const uid = userRes.data.user?.id ?? null;
      setUserId(uid);
      setUserEmail(userRes.data.user?.email ?? null);

      // admin_users는 본인 행만 SELECT 가능 — 행이 있으면 admin.
      // 테이블이 없거나(마이그레이션 미적용) 오류면 admin 아님으로 처리한다.
      const adminRes = await supabase
        .from("admin_users")
        .select("user_id")
        .maybeSingle();
      const admin = !adminRes.error && !!adminRes.data;
      setIsAdmin(admin);

      // Admin이 다른 계정을 선택하면 그 계정 데이터를 조회 (RLS가 SELECT만 허용)
      const target = admin && viewUserId ? viewUserId : uid;

      const [
        entriesRes,
        tasksRes,
        projectsRes,
        subtypesRes,
        prefsRes,
        adjacentRes,
        profilesRes,
      ] = await Promise.all([
          supabase
            .from("entries")
            .select(ENTRY_SELECT)
            .eq("user_id", target)
            .eq("report_date", date)
            .order("start_at", { ascending: true }),
          supabase
            .from("tasks")
            .select("*")
            .eq("user_id", target)
            .is("deleted_at", null)
            .order("created_at"),
          supabase
            .from("projects")
            .select("*")
            .eq("user_id", target)
            .is("deleted_at", null)
            .order("created_at"),
          supabase
            .from("subtypes")
            .select("*")
            .eq("user_id", target)
            .eq("archived", false)
            .order("name"),
          // 컬럼 폭 등 UI 설정은 항상 본인 것 사용
          supabase.from("user_preferences").select("*").maybeSingle(),
          // 이전/다음 날 collapsed preview용 요약
          supabase
            .from("entries")
            .select("report_date, start_at, end_at")
            .eq("user_id", target)
            .in("report_date", [prevDate, nextDate]),
          // 계정 셀렉터용 프로필 목록 (admin일 때만 의미 있음)
          admin
            ? supabase.from("profiles").select("*").order("email")
            : Promise.resolve({ data: null, error: null }),
        ]);

      const firstError =
        entriesRes.error ??
        tasksRes.error ??
        projectsRes.error ??
        subtypesRes.error ??
        prefsRes.error;
      if (firstError) throw firstError;

      setEntries(
        normalizeEntries((entriesRes.data ?? []) as unknown as EntryWithRelations[])
      );
      setTasks(tasksRes.data ?? []);
      setProjects(projectsRes.data ?? []);
      setSubtypes(subtypesRes.data ?? []);
      setColumnWidths(
        (prefsRes.data?.column_widths as Record<string, number>) ?? {}
      );
      setViewProfiles(admin ? ((profilesRes.data ?? []) as Profile[]) : []);

      const adjacent = (adjacentRes.data ?? []) as Pick<
        Entry,
        "report_date" | "start_at" | "end_at"
      >[];
      const pick = (target: string): AdjacentDaySummary => {
        const list = adjacent.filter((e) => e.report_date === target);
        return { date: target, count: list.length, entries: list };
      };
      setAdjacentDays({ prev: pick(prevDate), next: pick(nextDate) });
    } catch (e) {
      console.error(e);
      setError("데이터를 불러오지 못했습니다. 네트워크 상태를 확인해주세요.");
    }
  }, [supabase, date, viewUserId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAll().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchAll]);

  const refetch = useCallback(async () => {
    await fetchAll();
  }, [fetchAll]);

  // 실패 시 서버 상태로 복구
  const recover = useCallback(async () => {
    try {
      await fetchAll();
    } catch {
      /* fetchAll 내부에서 error 상태 처리 */
    }
  }, [fetchAll]);

  // ---------- Entry CRUD ----------

  const createEntry = useCallback(
    async (input: CreateEntryInput): Promise<EntryWithRelations | null> => {
      if (!userId) return null;
      beginOp();
      // 현재 UI는 생성 폼 없이 즉시 저장하므로 "생성 시도 시작" 시점으로 발화 (KAN-3 검수 가정 B)
      track("entry_create_started");
      try {
        const start = combineDateTime(date, input.startHM);
        const end = combineDateTime(date, input.endHM);
        // 자정 넘김 허용: 종료가 시작보다 앞서면 다음 날로 해석
        if (end <= start) end.setDate(end.getDate() + 1);
        const { data, error } = await supabase
          .from("entries")
          .insert({
            user_id: userId,
            report_date: date,
            start_at: start.toISOString(),
            end_at: end.toISOString(),
            type_key: input.type_key ?? "work",
            content: input.content ?? "",
            status: "in_progress",
          })
          .select(ENTRY_SELECT)
          .single();
        if (error) throw error;
        const created = data as unknown as EntryWithRelations;
        setEntries((prev) => sortEntries([...prev, created]));
        // 신규 생성 저장 성공 시에만 발화. 자동저장(updateEntry)은 과다 발화 방지를 위해 제외 (KAN-3 검수 가정 A)
        // project_type/work_type은 생성 시점 값이 있을 때만 안전 버킷으로 전송 (KAN-32).
        // 현재 UI는 기본값 즉시 생성이라 대부분 생략됨 — Review Plan 4번의 알려진 한계
        const project = created.project_id
          ? projects.find((p) => p.id === created.project_id)
          : null;
        const workType = workTypeFromSubtype(
          created.subtype_id
            ? subtypes.find((s) => s.id === created.subtype_id)?.name
            : null
        );
        track("entry_saved", {
          ...(project && {
            project_type: project.analytics_bucket as ProjectType,
          }),
          ...(workType && { work_type: workType }),
          duration_bucket: durationBucket(
            Math.round((end.getTime() - start.getTime()) / 60000)
          ),
          has_todo: false, // 생성 직후에는 연결된 To-do 없음
          has_kpt: entries.some((e) => e.kpt_notes.length > 0), // 해당 날짜 기준 (KAN-3 검수 가정 C)
          entry_count: entries.length + 1,
        });
        return created;
      } catch (e) {
        console.error(e);
        await recover();
        return null;
      } finally {
        endOp();
      }
    },
    [supabase, userId, date, entries, projects, subtypes, beginOp, endOp, recover]
  );

  const updateEntry = useCallback(
    async (id: string, patch: Partial<Entry>) => {
      beginOp();
      const prev = entries;
      setEntries((cur) =>
        sortEntries(
          cur.map((e) => (e.id === id ? { ...e, ...patch } : e))
        )
      );
      try {
        const { error } = await supabase
          .from("entries")
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
      } catch (e) {
        console.error(e);
        setEntries(prev);
        await recover();
      } finally {
        endOp();
      }
    },
    [supabase, entries, beginOp, endOp, recover]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      beginOp();
      const prev = entries;
      setEntries((cur) => cur.filter((e) => e.id !== id));
      try {
        const { error } = await supabase.from("entries").delete().eq("id", id);
        if (error) throw error;
      } catch (e) {
        console.error(e);
        setEntries(prev);
        await recover();
      } finally {
        endOp();
      }
    },
    [supabase, entries, beginOp, endOp, recover]
  );

  // ---------- 동일 content 연속 Entry 일괄 처리 (KAN-27) ----------
  // 그룹 정의: 같은 report_date에서 content(공백 제거)가 같고 아직 done이 아닌 Entry.
  // 자정 교차 Entry는 시작일에 귀속되므로(KAN-24) 밤에 걸친 연속 작업도 같은 날짜 그룹으로 묶인다.

  const sameContentInProgress = useCallback(
    (entry: EntryWithRelations): EntryWithRelations[] => {
      const key = (entry.content ?? "").trim();
      if (!key) return [];
      return entries.filter(
        (e) =>
          e.id !== entry.id &&
          e.status !== "done" &&
          (e.content ?? "").trim() === key
      );
    },
    [entries]
  );

  const completeEntryGroup = useCallback(
    async (entry: EntryWithRelations) => {
      const ids = [entry.id, ...sameContentInProgress(entry).map((e) => e.id)];
      beginOp();
      const prev = entries;
      setEntries((cur) =>
        cur.map((e) => (ids.includes(e.id) ? { ...e, status: "done" } : e))
      );
      try {
        const { error } = await supabase
          .from("entries")
          .update({ status: "done", updated_at: new Date().toISOString() })
          .in("id", ids);
        if (error) throw error;
      } catch (e) {
        console.error(e);
        setEntries(prev);
        await recover();
      } finally {
        endOp();
      }
    },
    [supabase, entries, sameContentInProgress, beginOp, endOp, recover]
  );

  // ---------- Entry <-> Task 연결 ----------

  const attachTask = useCallback(
    async (entryId: string, taskId: string) => {
      if (!userId) return;
      beginOp();
      try {
        const { error } = await supabase
          .from("entry_tasks")
          .upsert({ entry_id: entryId, task_id: taskId, user_id: userId });
        if (error) throw error;
        track("todo_attached_to_entry");
        const task = tasks.find((t) => t.id === taskId) ?? null;
        setEntries((cur) =>
          cur.map((e) =>
            e.id === entryId
              ? {
                  ...e,
                  entry_tasks: [
                    ...e.entry_tasks.filter((et) => et.task_id !== taskId),
                    { task_id: taskId, tasks: task },
                  ],
                }
              : e
          )
        );
      } catch (e) {
        console.error(e);
        await recover();
      } finally {
        endOp();
      }
    },
    [supabase, userId, tasks, beginOp, endOp, recover]
  );

  const detachTask = useCallback(
    async (entryId: string, taskId: string) => {
      beginOp();
      setEntries((cur) =>
        cur.map((e) =>
          e.id === entryId
            ? {
                ...e,
                entry_tasks: e.entry_tasks.filter(
                  (et) => et.task_id !== taskId
                ),
              }
            : e
        )
      );
      try {
        const { error } = await supabase
          .from("entry_tasks")
          .delete()
          .eq("entry_id", entryId)
          .eq("task_id", taskId);
        if (error) throw error;
      } catch (e) {
        console.error(e);
        await recover();
      } finally {
        endOp();
      }
    },
    [supabase, beginOp, endOp, recover]
  );

  // ---------- Links ----------

  const addLink = useCallback(
    async (entryId: string, link: { title: string; url: string; memo?: string }) => {
      if (!userId) return;
      beginOp();
      try {
        const { data, error } = await supabase
          .from("entry_links")
          .insert({
            user_id: userId,
            entry_id: entryId,
            title: link.title,
            url: link.url,
            memo: link.memo ?? null,
          })
          .select("*")
          .single();
        if (error) throw error;
        setEntries((cur) =>
          cur.map((e) =>
            e.id === entryId
              ? { ...e, entry_links: [...e.entry_links, data as EntryLink] }
              : e
          )
        );
      } catch (e) {
        console.error(e);
        await recover();
      } finally {
        endOp();
      }
    },
    [supabase, userId, beginOp, endOp, recover]
  );

  const updateLink = useCallback(
    async (linkId: string, patch: Partial<EntryLink>) => {
      beginOp();
      setEntries((cur) =>
        cur.map((e) => ({
          ...e,
          entry_links: e.entry_links.map((l) =>
            l.id === linkId ? { ...l, ...patch } : l
          ),
        }))
      );
      try {
        const { error } = await supabase
          .from("entry_links")
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq("id", linkId);
        if (error) throw error;
      } catch (e) {
        console.error(e);
        await recover();
      } finally {
        endOp();
      }
    },
    [supabase, beginOp, endOp, recover]
  );

  const deleteLink = useCallback(
    async (linkId: string) => {
      beginOp();
      setEntries((cur) =>
        cur.map((e) => ({
          ...e,
          entry_links: e.entry_links.filter((l) => l.id !== linkId),
        }))
      );
      try {
        const { error } = await supabase
          .from("entry_links")
          .delete()
          .eq("id", linkId);
        if (error) throw error;
      } catch (e) {
        console.error(e);
        await recover();
      } finally {
        endOp();
      }
    },
    [supabase, beginOp, endOp, recover]
  );

  // ---------- KPT+ ----------

  const saveKpt = useCallback(
    async (
      entryId: string,
      patch: Partial<
        Pick<KptNote, "keep_text" | "problem_text" | "try_text" | "plus_text">
      >
    ) => {
      if (!userId) return;
      beginOp();
      // blur마다 저장되므로 첫 작성(노트 없음 → 있음) 시에만 kpt_saved 발화 (KAN-13, 중복 방지)
      const existed = entries.some(
        (e) => e.id === entryId && e.kpt_notes.length > 0
      );
      try {
        const { data, error } = await supabase
          .from("kpt_notes")
          .upsert(
            {
              user_id: userId,
              entry_id: entryId,
              ...patch,
              // 소프트 삭제된 노트가 있으면 재저장으로 되살린다 (KAN-23)
              deleted_at: null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,entry_id" }
          )
          .select("*")
          .single();
        if (error) throw error;
        if (!existed) track("kpt_saved");
        setEntries((cur) =>
          cur.map((e) =>
            e.id === entryId ? { ...e, kpt_notes: [data as KptNote] } : e
          )
        );
      } catch (e) {
        console.error(e);
        await recover();
      } finally {
        endOp();
      }
    },
    [supabase, userId, entries, beginOp, endOp, recover]
  );

  // KPT+ 소프트 삭제 (KAN-23):
  // - kpt_notes.deleted_at만 기록하고 행은 남긴다 (entry_id unique 행 재사용).
  // - 같은 Entry에 다시 저장하면 saveKpt의 upsert가 deleted_at을 null로 되돌린다.
  //   이때 이전 내용이 되살아나지 않도록 패널은 네 필드를 모두 덮어쓴다.
  const deleteKpt = useCallback(
    async (entryId: string) => {
      beginOp();
      const prev = entries;
      setEntries((cur) =>
        cur.map((e) => (e.id === entryId ? { ...e, kpt_notes: [] } : e))
      );
      try {
        const { error } = await supabase
          .from("kpt_notes")
          .update({ deleted_at: new Date().toISOString() })
          .eq("entry_id", entryId);
        if (error) throw error;
      } catch (e) {
        console.error(e);
        setEntries(prev);
        await recover();
      } finally {
        endOp();
      }
    },
    [supabase, entries, beginOp, endOp, recover]
  );

  // ---------- Tasks ----------

  const createTask = useCallback(
    async (input: CreateTaskInput): Promise<Task | null> => {
      if (!userId) return null;
      beginOp();
      try {
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            user_id: userId,
            title: input.title,
            list: input.list ?? "today",
            priority: input.priority ?? "medium",
            project_id: input.project_id ?? null,
            due_date: input.due_date ?? null,
            estimated_minutes: input.estimated_minutes ?? null,
          })
          .select("*")
          .single();
        if (error) throw error;
        // 연결 프로젝트가 있으면 안전 버킷(project_type)만 전송 (KAN-32)
        const taskProject = input.project_id
          ? projects.find((p) => p.id === input.project_id)
          : null;
        track(
          "todo_created",
          taskProject
            ? { project_type: taskProject.analytics_bucket as ProjectType }
            : {}
        );
        setTasks((cur) => [...cur, data as Task]);
        return data as Task;
      } catch (e) {
        console.error(e);
        await recover();
        return null;
      } finally {
        endOp();
      }
    },
    [supabase, userId, projects, beginOp, endOp, recover]
  );

  const updateTask = useCallback(
    async (id: string, patch: Partial<Task>) => {
      beginOp();
      const prevTasks = tasks;
      const apply = (t: Task) => (t.id === id ? { ...t, ...patch } : t);
      setTasks((cur) => cur.map(apply));
      // Entry에 연결된 To-do 칩도 동기화
      setEntries((cur) =>
        cur.map((e) => ({
          ...e,
          entry_tasks: e.entry_tasks.map((et) =>
            et.task_id === id && et.tasks
              ? { ...et, tasks: { ...et.tasks, ...patch } }
              : et
          ),
        }))
      );
      try {
        const { error } = await supabase
          .from("tasks")
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
      } catch (e) {
        console.error(e);
        setTasks(prevTasks);
        await recover();
      } finally {
        endOp();
      }
    },
    [supabase, tasks, beginOp, endOp, recover]
  );

  // To-do 소프트 삭제 (KAN-23 연결 데이터 규칙):
  // - tasks.deleted_at만 기록하고 행은 남긴다.
  // - entry_tasks 연결 행은 지우지 않는다 (기록 보존). 화면에서는 목록과
  //   Entry 연결 칩 모두에서 숨기고, deleted_at을 null로 되돌리면 연결이 복구된다.
  const deleteTask = useCallback(
    async (id: string) => {
      beginOp();
      const prevTasks = tasks;
      const prevEntries = entries;
      setTasks((cur) => cur.filter((t) => t.id !== id));
      setEntries((cur) =>
        cur.map((e) => ({
          ...e,
          entry_tasks: e.entry_tasks.filter((et) => et.task_id !== id),
        }))
      );
      try {
        const { error } = await supabase
          .from("tasks")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
      } catch (e) {
        console.error(e);
        setTasks(prevTasks);
        setEntries(prevEntries);
        await recover();
      } finally {
        endOp();
      }
    },
    [supabase, tasks, entries, beginOp, endOp, recover]
  );

  const toggleTaskDone = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      const done = task.status !== "done";
      await updateTask(id, {
        status: done ? "done" : "in_progress",
        completed_at: done ? new Date().toISOString() : null,
      });
    },
    [tasks, updateTask]
  );

  // To-do 상태 3단계 순환: not_started → in_progress → done → not_started (KAN-33)
  const cycleTaskStatus = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      const order = ["not_started", "in_progress", "done"] as const;
      const idx = order.indexOf(task.status as (typeof order)[number]);
      const next = order[(idx + 1) % order.length];
      await updateTask(id, {
        status: next,
        completed_at: next === "done" ? new Date().toISOString() : null,
      });
    },
    [tasks, updateTask]
  );

  // ---------- Projects / Subtypes ----------

  const createProject = useCallback(
    async (
      name: string,
      orgName?: string,
      analyticsBucket?: string
    ): Promise<Project | null> => {
      if (!userId) return null;
      beginOp();
      try {
        const color = PROJECT_COLORS[projects.length % PROJECT_COLORS.length];
        const { data, error } = await supabase
          .from("projects")
          .insert({
            user_id: userId,
            name,
            org_name: orgName || null,
            color,
            analytics_bucket: analyticsBucket || "etc",
          })
          .select("*")
          .single();
        if (error) throw error;
        setProjects((cur) => [...cur, data as Project]);
        return data as Project;
      } catch (e) {
        console.error(e);
        await recover();
        return null;
      } finally {
        endOp();
      }
    },
    [supabase, userId, projects.length, beginOp, endOp, recover]
  );

  const updateProject = useCallback(
    async (id: string, patch: Partial<Project>) => {
      beginOp();
      const prev = projects;
      setProjects((cur) =>
        cur.map((p) => (p.id === id ? { ...p, ...patch } : p))
      );
      try {
        const { error } = await supabase
          .from("projects")
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
      } catch (e) {
        console.error(e);
        setProjects(prev);
        await recover();
      } finally {
        endOp();
      }
    },
    [supabase, projects, beginOp, endOp, recover]
  );

  // Project 소프트 삭제 (KAN-23 연결 데이터 규칙):
  // - projects.deleted_at만 기록하고 행은 남긴다.
  // - Entry/Task의 project_id는 그대로 유지한다 (기록 보존).
  //   삭제된 프로젝트는 조회에서 빠지므로 화면에서는 프로젝트 칩이 비어 보이고,
  //   deleted_at을 null로 되돌리면 기존 연결이 그대로 복구된다.
  const deleteProject = useCallback(
    async (id: string) => {
      beginOp();
      const prev = projects;
      setProjects((cur) => cur.filter((p) => p.id !== id));
      try {
        const { error } = await supabase
          .from("projects")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
      } catch (e) {
        console.error(e);
        setProjects(prev);
        await recover();
      } finally {
        endOp();
      }
    },
    [supabase, projects, beginOp, endOp, recover]
  );

  const createSubtype = useCallback(
    async (typeKey: TypeKey, name: string): Promise<Subtype | null> => {
      if (!userId) return null;
      beginOp();
      try {
        const { data, error } = await supabase
          .from("subtypes")
          .insert({ user_id: userId, type_key: typeKey, name })
          .select("*")
          .single();
        if (error) throw error;
        setSubtypes((cur) =>
          [...cur, data as Subtype].sort((a, b) => a.name.localeCompare(b.name))
        );
        return data as Subtype;
      } catch (e) {
        console.error(e);
        await recover();
        return null;
      } finally {
        endOp();
      }
    },
    [supabase, userId, beginOp, endOp, recover]
  );

  // ---------- 환경설정 (컬럼 폭) ----------

  const widthsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveColumnWidths = useCallback(
    (widths: Record<string, number>) => {
      setColumnWidths(widths);
      if (!userId) return;
      if (widthsTimer.current) clearTimeout(widthsTimer.current);
      widthsTimer.current = setTimeout(async () => {
        const { error } = await supabase.from("user_preferences").upsert({
          user_id: userId,
          column_widths: widths,
          updated_at: new Date().toISOString(),
        });
        if (error) console.error(error);
      }, 600);
    },
    [supabase, userId]
  );

  return {
    loading,
    error,
    saving: pendingOps > 0,
    userId,
    userEmail,
    // Admin 조회 모드 (KAN-26)
    isAdmin,
    viewProfiles,
    viewingOther: isAdmin && !!viewUserId && viewUserId !== userId,
    entries,
    tasks,
    projects,
    subtypes,
    columnWidths,
    adjacentDays,
    refetch,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    sameContentInProgress,
    completeEntryGroup,
    attachTask,
    detachTask,
    addLink,
    updateLink,
    deleteLink,
    saveKpt,
    deleteKpt,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskDone,
    cycleTaskStatus,
    createProject,
    updateProject,
    deleteProject,
    createSubtype,
    saveColumnWidths,
  };
}

export type DailyReport = ReturnType<typeof useDailyReport>;
