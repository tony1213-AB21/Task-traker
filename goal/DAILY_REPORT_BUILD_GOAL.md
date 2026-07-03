# DAILY_REPORT_BUILD_GOAL.md

> Repository context:
> Read `goal/README.md` first for document priority, design source role, and the Claude Code `/goal` prompt location.
> The approved Claude Design export currently lives at `goal/Daily Report.html`.

## 0. Mission

Build a production-ready MVP of **Daily Report**, a desktop-first personal operating log for recording actual time usage, linking work to projects and to-dos, writing per-entry KPT+ reflections, and reviewing daily analysis.

This project should be built autonomously until the goal is satisfied.

The final product must feel like the approved Claude Design prototype:

- Airtable-like structured table
- Notion-like warm paper canvas
- Linear-like precision in the right contextual panel
- Light mode only for v1
- Desktop/laptop first
- Daily Report table is the main screen
- Right panel edits and interprets the selected entry

Do **not** turn this into a generic task app, calendar app, or dashboard-first analytics app.

---

## 1. How to use the Claude Design HTML

The current Claude Design exported HTML file is:

```text
goal/Daily Report.html
```

Use it as the visual and interaction reference.

Instructions:

1. Import or inspect the Claude Design HTML.
2. Extract the layout, spacing, colors, table structure, right panel structure, chip styles, and component references.
3. Rebuild the product as a real web app using the recommended stack below.
4. Do not simply serve the static HTML.
5. Do not hardcode the UI as a nonfunctional mockup.
6. Match the design closely, but prioritize working product behavior over pixel-perfect reproduction when tradeoffs are necessary.

The Claude Design prototype is a **design reference**, not the final implementation.

---

## 2. Recommended tech stack

Use the most effective modern stack for this product:

```text
Next.js + TypeScript + React + Supabase + TanStack Table + Tailwind CSS
```

Recommended libraries:

```text
next
react
typescript
@supabase/supabase-js
@supabase/ssr
@tanstack/react-table
tailwindcss
date-fns or dayjs
zod
react-hook-form
lucide-react
recharts
```

Optional:

```text
shadcn/ui
```

Use shadcn/ui only if it speeds up implementation without making the app look generic.

Do **not** over-engineer with:
- Redux
- GraphQL
- serverless queues
- microservices
- complex DnD frameworks for v1

Drag-and-drop is not required for MVP. Use explicit attach buttons / searchable reference selection first.

---

## 3. Product concept

Daily Report has four core objects.

### 3.1 Entry

A time record of what actually happened.

Each row in the Daily Report table is one Entry.

An Entry has:
- date
- start time
- end time
- duration, calculated from start/end
- type
- subtype
- project
- content
- related to-do
- status
- tags
- links
- KPT+

### 3.2 Task

A to-do item that can be linked to an Entry.

A task can exist independently in Today or Backlog, but it can also be attached to one or more actual time entries.

### 3.3 Project

A larger context that groups Entries and Tasks.

Important rule:

> Company / organization belongs to Project metadata, not to the Entry row.

Examples:

| Project | Org |
|---|---|
| Daily Report Web | Personal |
| 소리교육 MVP | Abitus21 |
| 소리기억 사업계획서 | Abitus21 |
| 구직/면접 | Personal |
| 포트폴리오 리디자인 | Personal |

### 3.4 Review

Review data comes from KPT+ and Analysis.

KPT+ is written per Entry, not as a default daily summary.

Daily/weekly KPT digest can be added later, but the MVP must support entry-level KPT+ first.

---

## 4. MVP scope

Build these features in v1.

### 4.1 Authentication

Required:

- Email authentication with Supabase Auth
- Magic link or OTP flow
- Login screen with warm off-white background and white auth card
- No password-based custom auth
- No public anonymous access to private user data
- User can sign out

Security:

- Enable Supabase RLS from the beginning
- Every user-owned table must include `user_id`
- RLS must prevent a user from reading/writing another user's data

### 4.2 Daily Report main table

Required:

- Main route after login shows Daily Report table
- Daily Report table is the primary screen
- Right contextual panel is visible on desktop
- Date navigation:
  - previous day
  - next day
  - today
  - current date label
- Search input
- Add Entry button
- Tracked / Untracked summary at top

Table columns:

```text
#
Time
Duration
Type
Subtype
Project
Content
Related To-do
Status
```

Tags should be hidden by default behind `Tags 보기` or handled in Detail panel. Do not let Tags steal table space in v1.

Link should **not** be a default table column. Links belong in Detail panel.

### 4.3 Table density and behavior

The table must feel like Google Sheets / Airtable.

Required:

- Compact row height, approximately 36–40px by default
- Content one-line ellipsis by default
- Selected row state
- Active cell / focus state
- Empty rows visible at the bottom
- Add new entry row / button
- Keyboard-friendly inputs where practical
- Column resize handles
- Drag column boundary to resize column width
- Double-click column boundary to auto-fit to visible content, like Google Sheets
- Persist user-adjusted column widths locally or in DB
- Horizontal scroll allowed if needed
- Content column should be the largest flexible column
- Duration column should be visually compact and right-aligned

Recommended column priority:

```text
narrow: #, Time, Duration, Type, Status
medium: Subtype, Project, Related To-do
wide: Content
hidden by default: Tags, Links
```

### 4.4 Duration format

In the table, duration must always display as `HH:MM`.

Examples:

```text
35 minutes -> 00:35
1 hour -> 01:00
1 hour 20 minutes -> 01:20
13 hours 35 minutes -> 13:35
```

The top summary and Analysis cards may display human-readable format such as `13h 35m`.

### 4.5 Fixed top-level types

The top-level type list is fixed.

Display labels must be Korean:

```text
업무
학습/성장
건강/운동
식사/생활
수면/휴식
자기관리
관계/소통
여가/취미
경제/재무
이동/대기
기타
```

Internal enum values may be English:

```text
work
learning_growth
health_exercise
meal_life
sleep_rest
self_care
relationship_communication
leisure_hobby
finance
travel_waiting
other
```

Type behavior:

- Type is a colored pill
- Type colors should be soft, readable, and consistent
- Type is fixed and should not be user-renamable in v1
- The user may add custom subtypes under each type

### 4.6 Subtypes

Required:

- Subtype depends on selected Type
- User can add custom subtype
- Subtype chip is less visually strong than Type chip
- Subtype can be renamed or archived if easy; otherwise leave for v1.1

Default subtype examples:

```text
업무: Admin, Planning, Development, Design, Research, Writing, Meeting, Operation
학습/성장: 학습, Interview Prep, English, Reading, Course, Research
건강/운동: 아침 루틴, 산책, 헬스, 병원, 스트레칭
식사/생활: 식사, 장보기, 청소, 세탁
수면/휴식: 수면, 휴식, 낮잠
관계/소통: 커뮤니케이션, 가족, 친구, 협업자
이동/대기: 이동, 대기
```

### 4.7 Projects

Required:

- User can create/select a Project from Entry Detail or table reference field
- Project has Org/company metadata
- Project appears as a neutral reference chip with a small color dot
- Project is not required for every Entry
- If no project: display `프로젝트 없음`
- Project panel shows project cards

Project card fields:

```text
Project name
Org / company
Status
Total tracked time today
Recent entries
Linked to-dos
Completion rate
Last updated
```

Add button:

```text
전체 프로젝트 열기 ↗
```

Full projects page can be a simple route in v1 or a placeholder if not enough time, but the button should not break.

### 4.8 Tasks / To-do

Required:

- To-do panel with sections:
  - Today
  - Backlog
- Create task
- Check/uncheck task
- Task title
- Project reference
- Priority
- Due date
- Estimated time
- Status
- Attach task to selected Entry
- Start timer from To-do button can be present; full timer behavior is optional for v1

Important:

- MVP linking should use explicit `선택 기록에 연결` / attach action, not drag-and-drop
- Related To-do chip appears in Entry table and Detail panel
- Checking a linked to-do should reflect completed state in the to-do panel and reference chip
- Drag-and-drop can be left for later

### 4.9 Detail panel

Right-side Detail panel is the default tab when a row is selected.

Required editable fields:

```text
Time range
Duration
Type
Subtype
Project
Content
Related To-do
Links
Status
Tags
```

Detail panel header must show selected entry context:

```text
Entry #05
09:45–11:15 · 01:30
Project: Daily Report Web · Org: Personal
```

Content:

- Large editable textarea
- Auto-save or explicit save
- Clear focus state
- Full content editing happens here

Related To-do:

- Editable reference chip
- Checkbox sync
- Can remove relation

Links:

- Multi-link field
- Zero, one, or many links
- Each link has:
  - title
  - URL
  - optional memo
- Display `+ 링크 추가`
- If an Entry has links, table row may show a small link icon/count near Content, but no full link column

### 4.10 KPT+

KPT+ is attached to the selected Entry.

This is critical.

Do **not** implement KPT+ as a default daily reflection.

KPT+ panel structure:

```text
Selected Entry summary
Keep textarea
Problem textarea
Try textarea
Plus textarea
To-do로 전환 button for Plus
Collapsed weekly digest link
```

Required copy:

```text
선택한 기록에 대한 KPT+를 작성합니다.
```

Do not use:

```text
하루를 4가지 관점으로 회고합니다.
```

Each KPT field must be editable.

Plus behavior:

- Plus acts as an idea inbox
- `To-do로 전환` creates a new Task from the Plus text
- The new Task can be added to Backlog by default

Weekly KPT digest:

- Secondary/collapsed only
- Can be placeholder in v1

### 4.11 Analysis panel

Analysis is compact and secondary. It must not become the main screen.

Required:

```text
Tracked today
Untracked today
To-do completion
Estimated vs Actual
Type distribution
Project time
Problem count
전체 분석 열기 ↗
```

Untracked rule:

```text
Untracked = 첫 기록과 마지막 기록 사이의 빈 시간
```

For v1, compute untracked as gaps between the earliest start time and latest end time of the selected date. Do not use full 24-hour day as default.

Charts:

- Use simple bars / stacked bars
- Recharts is acceptable
- Keep calm and readable
- Avoid flashy dashboards

Full analysis page can be simple or placeholder if time is limited, but the button should not break.

### 4.12 Continuous day scroll concept

Required as a light UX concept if feasible.

Preferred behavior:

- Daily Report can show day sections in a vertical scroll
- Scrolling up reveals previous day preview
- Scrolling down reveals next day or empty state
- Each date has a sticky day divider
- Top date indicator updates based on visible day
- Date arrow buttons and Today button remain available

MVP acceptable fallback:

- Implement date navigation first
- Add sticky day divider for current day
- Add previous-day collapsed preview above current day if feasible
- Do not block MVP completion if full continuous day virtualization takes too long

### 4.13 Time overlap warning

Required:

- Detect overlapping entries for the same user and report date
- Show non-blocking warning
- Allow save anyway

Example:

```text
이 기록은 13:15–14:35 “온보딩 플로우 기획”과 시간이 겹칩니다. 그래도 저장할 수 있습니다.
```

Warnings should appear:
- in the row as a small warning
- in Detail panel for the selected Entry

### 4.14 Status

Use status chips:

```text
Not started
In progress
Done
Paused
Blocked
```

Korean display is acceptable, but the current prototype uses English chips. Either is okay as long as consistent.

Recommended internal enum:

```text
not_started
in_progress
done
paused
blocked
```

### 4.15 Export

Optional for v1, but add if easy:

- CSV export for entries
- Do not prioritize Excel export

---

## 5. Database schema

Use Supabase Postgres.

Create migrations if using Supabase CLI. If migrations are not possible, provide SQL in `supabase/schema.sql`.

All user-owned tables must include:

```sql
user_id uuid not null references auth.users(id) on delete cascade
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Recommended schema:

### 5.1 profiles

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 5.2 projects

```sql
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  org_name text,
  status text not null default 'active',
  color text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 5.3 subtypes

```sql
create table public.subtypes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type_key text not null,
  name text not null,
  color text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, type_key, name)
);
```

### 5.4 tasks

```sql
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  list text not null default 'today',
  priority text not null default 'medium',
  status text not null default 'not_started',
  due_date date,
  estimated_minutes integer,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 5.5 entries

```sql
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_date date not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  type_key text not null,
  subtype_id uuid references public.subtypes(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  content text,
  status text not null default 'done',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entries_time_order check (end_at > start_at)
);
```

Duration should be calculated in application code from `start_at` and `end_at`. Do not store duration as a primary source of truth unless caching is explicitly needed.

### 5.6 entry_tasks

Many-to-many is better than one-to-one, even if UI mostly shows one related to-do.

```sql
create table public.entry_tasks (
  entry_id uuid not null references public.entries(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (entry_id, task_id)
);
```

### 5.7 entry_links

```sql
create table public.entry_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid not null references public.entries(id) on delete cascade,
  title text not null,
  url text not null,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 5.8 kpt_notes

One KPT+ note object per Entry.

```sql
create table public.kpt_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid not null references public.entries(id) on delete cascade,
  keep_text text,
  problem_text text,
  try_text text,
  plus_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, entry_id)
);
```

### 5.9 user_preferences

For column widths and UI settings.

```sql
create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  column_widths jsonb not null default '{}',
  density text not null default 'compact',
  default_report_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 6. RLS requirements

Enable RLS on all tables.

Every user-owned table must have policies:

- select own rows
- insert own rows
- update own rows
- delete own rows

Example pattern:

```sql
alter table public.projects enable row level security;

create policy "Users can view own projects"
on public.projects for select
using (auth.uid() = user_id);

create policy "Users can insert own projects"
on public.projects for insert
with check (auth.uid() = user_id);

create policy "Users can update own projects"
on public.projects for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own projects"
on public.projects for delete
using (auth.uid() = user_id);
```

Apply equivalent policies to:
- projects
- subtypes
- tasks
- entries
- entry_tasks
- entry_links
- kpt_notes
- user_preferences

For `profiles`, use `id = auth.uid()`.

Do not skip RLS.

---

## 7. Routes and app structure

Recommended routes:

```text
/
  redirect based on auth

/login
  email magic link / OTP auth

/app
  main Daily Report screen

/app/analysis
  full analysis page or MVP placeholder

/app/projects
  full projects page or MVP placeholder
```

Recommended folders:

```text
src/
  app/
    login/
    app/
      page.tsx
      analysis/
      projects/
  components/
    app-shell/
    daily-report-table/
    right-panel/
    kpt/
    todo/
    projects/
    analysis/
    auth/
    ui/
  lib/
    supabase/
    types/
    utils/
    time/
  db/
    types.ts
supabase/
  migrations/
  schema.sql
```

---

## 8. UI implementation details

### 8.1 Visual style

Match the approved prototype:

- Light mode
- Warm off-white app canvas, close to `#f6f5f4`
- White table/panel surfaces
- Hairline grid lines
- Lavender-blue primary accent, close to `#5e6ad2`
- Colored but soft Type pills
- Neutral Project chips with small color dots
- Compact rows
- Minimal shadows
- No heavy gradients
- No dark mode in v1

### 8.2 Right panel tabs

Tabs:

```text
Detail
KPT+
To-do
Analysis
Projects
```

Behavior:

- Selecting a row updates the right panel context
- Detail is default
- Tab state persists while selected row changes
- If no row selected, show a helpful empty state

### 8.3 Search/filter/sort/group

MVP minimum:

- Search across content, project name, task title, tags
- Filter button can be functional or staged
- Sort by time
- Group by date section
- Tags 보기 toggles tag visibility or opens filter

Do not overbuild advanced filtering before core CRUD works.

---

## 9. Time and date rules

Use the user's local timezone.

For Korea default, timezone will generally be Asia/Seoul, but do not hardcode if avoidable.

Rules:

- `report_date` defaults to the local date of `start_at`
- `end_at` must be after `start_at`
- Cross-midnight entries are allowed
- Cross-midnight entry belongs to start date by default
- Duration is calculated from timestamps
- Overlap detection compares actual time ranges for the same user
- Untracked time is gaps between earliest start and latest end on the selected report_date

---

## 10. Seed/demo data

Create a simple seed mechanism for local development only.

Example date:

```text
2026-07-03
```

Seed entries should include:

- AWS/RDS/S3 cleanup
- 세무 대리인 문의
- Supabase Auth / RLS policy work
- Daily Report Web design-system work
- 소리교육 MVP planning
- 소리기억 사업계획서 writing
- 구직/면접 preparation
- 운동 / 식사 / 휴식 / 이동
- one time-overlap warning
- one blocked status
- one paused status
- multiple links on one Entry
- one Entry with KPT+
- linked To-dos

Do not ship demo data into real user accounts unless explicitly triggered.

---

## 11. Acceptance criteria

The task is complete only when all items below are true.

### Auth and security

- User can log in with email magic link or OTP.
- User can log out.
- Logged-out users cannot access `/app`.
- Supabase RLS is enabled.
- User data is scoped by `user_id`.
- `.env.example` exists.
- No secrets are committed.

### Main table

- User can create an Entry.
- User can edit an Entry.
- User can delete an Entry.
- User can select an Entry and see it in the right panel.
- Duration displays as `HH:MM` in the table.
- Content appears as one-line ellipsis in compact table rows.
- Content is editable as a large textarea in Detail.
- Column widths can be resized.
- Double-clicking a column boundary auto-fits visible content if feasible.
- User column widths persist.
- Link is not a default table column.
- Multi-link editing works in Detail.

### Type/subtype

- Fixed Korean type labels appear as colored pills.
- User can add custom subtype.
- Subtype belongs to a type.
- Subtype appears as a lighter/neutral chip.

### Project

- User can create/select a Project.
- Project has Org/company metadata.
- Project appears as reference chip.
- Projects panel shows Org metadata.
- Entry row does not have a separate Company column.

### To-do

- User can create a To-do.
- User can check/uncheck a To-do.
- User can attach a To-do to the selected Entry.
- Linked To-do appears in Entry row and Detail panel.
- Completed To-do state is visually synced.

### KPT+

- KPT+ belongs to selected Entry.
- KPT+ is not a default daily summary.
- User can write/edit Keep, Problem, Try, Plus.
- Plus can be converted to a To-do.
- Weekly digest is collapsed/secondary or placeholder.

### Analysis

- Analysis panel shows tracked time.
- Analysis panel shows untracked time using gap rule.
- Analysis panel shows To-do completion.
- Analysis panel shows Estimated vs Actual if task estimates exist.
- Analysis panel shows Type distribution.
- Analysis panel shows Project time.
- `전체 분석 열기 ↗` does not break.

### UX and design

- Main screen is the Daily Report table, not dashboard.
- Right panel is contextual.
- Light mode matches the design prototype.
- Row density is compact.
- UI remains usable at desktop/laptop widths.
- Mobile-first redesign is not implemented.

### Code quality

- TypeScript builds without errors.
- Lint passes or known non-blocking warnings are documented.
- README includes setup instructions.
- Database SQL/migrations are documented.
- Basic error states exist.
- Loading states exist.

---

## 12. Out of scope for v1

Do not spend MVP time on:

- Full drag-and-drop linking
- Full mobile card UI
- Dark mode
- Monthly analytics
- AI summaries
- Calendar integration
- Full spreadsheet formula engine
- Multi-user collaboration
- Team workspaces
- Payment/subscription
- Native app
- Advanced template system
- Excel export

---

## 13. Development process for autonomous `/goal`

Work autonomously toward the acceptance criteria.

Suggested execution order:

1. Inspect Claude Design HTML.
2. Initialize or inspect project.
3. Set up Next.js + TypeScript + Tailwind.
4. Set up Supabase client/server utilities.
5. Add `.env.example`.
6. Create DB schema / migrations.
7. Implement Auth.
8. Implement protected `/app`.
9. Implement data types and CRUD API/client functions.
10. Implement Daily Report table.
11. Implement Detail panel.
12. Implement Projects.
13. Implement To-do and Entry linking.
14. Implement KPT+.
15. Implement Links.
16. Implement Analysis.
17. Implement column resizing / persistence.
18. Implement overlap warnings.
19. Add loading/empty/error states.
20. Add seed/demo helpers for local development.
21. Run build/lint/typecheck.
22. Fix errors.
23. Verify acceptance criteria.
24. Document anything incomplete.

If a requirement conflicts with the imported Claude Design HTML, prioritize this MD file.

If a feature is too complex for immediate implementation, build the simplest working version that satisfies the user value, then document the tradeoff.

Do not stop after creating a static mockup. The goal is a working MVP.

---

## 14. Final delivery

When finished, provide:

- Summary of implemented features
- Setup instructions
- Required environment variables
- Supabase migration / schema location
- Known limitations
- How to run locally
- How to deploy
- Checklist against acceptance criteria

The final answer should be honest. If anything is incomplete, state it clearly.
