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
  Project,
  Subtype,
  Task,
  TaskList,
  TaskPriority,
  TypeKey,
} from "@/lib/types/database";
import { PROJECT_COLORS } from "@/lib/types/meta";
import { combineDateTime } from "@/lib/time/format";

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

export function useDailyReport(date: string) {
  const supabase = useRef(createClient()).current;
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

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
      const [
        entriesRes,
        tasksRes,
        projectsRes,
        subtypesRes,
        prefsRes,
        userRes,
        adjacentRes,
      ] = await Promise.all([
          supabase
            .from("entries")
            .select(ENTRY_SELECT)
            .eq("report_date", date)
            .order("start_at", { ascending: true }),
          supabase
            .from("tasks")
            .select("*")
            .is("deleted_at", null)
            .order("created_at"),
          supabase
            .from("projects")
            .select("*")
            .is("deleted_at", null)
            .order("created_at"),
          supabase.from("subtypes").select("*").eq("archived", false).order("name"),
          supabase.from("user_preferences").select("*").maybeSingle(),
          supabase.auth.getUser(),
          // 이전/다음 날 collapsed preview용 요약
          supabase
            .from("entries")
            .select("report_date, start_at, end_at")
            .in("report_date", [prevDate, nextDate]),
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
      setUserId(userRes.data.user?.id ?? null);
      setUserEmail(userRes.data.user?.email ?? null);

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
  }, [supabase, date]);

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
        return created;
      } catch (e) {
        console.error(e);
        await recover();
        return null;
      } finally {
        endOp();
      }
    },
    [supabase, userId, date, beginOp, endOp, recover]
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
    [supabase, userId, beginOp, endOp, recover]
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
    [supabase, userId, beginOp, endOp, recover]
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

  // ---------- Projects / Subtypes ----------

  const createProject = useCallback(
    async (name: string, orgName?: string): Promise<Project | null> => {
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
    createProject,
    updateProject,
    deleteProject,
    createSubtype,
    saveColumnWidths,
  };
}

export type DailyReport = ReturnType<typeof useDailyReport>;
