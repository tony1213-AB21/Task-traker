-- 로컬 개발용 데모 데이터
-- 주의: 로컬/개발 환경에서만 실행하세요. 실제 사용자 계정에 배포하지 마세요.
-- 실행 방법: 로그인(가입)한 뒤 Supabase SQL Editor에서 실행합니다.
-- 기본적으로 가장 먼저 생성된 사용자에게 시드합니다.
-- 특정 사용자에게 시드하려면 아래 v_user 할당을 이메일 조회로 바꾸세요:
--   v_user := (select id from auth.users where email = 'demo@example.com');

do $$
declare
  v_user uuid;
  v_date date := date '2026-07-03';
  -- 시드 데이터의 벽시계 시간을 해석할 타임존 (데모 데이터 전용)
  v_tz text := 'Asia/Seoul';
  p_dr uuid;   -- Daily Report Web
  p_edu uuid;  -- 소리교육 MVP
  p_plan uuid; -- 소리기억 사업계획서
  p_job uuid;  -- 구직/면접
  p_port uuid; -- 포트폴리오 리디자인
  st_admin uuid; st_dev uuid; st_design uuid; st_planning uuid; st_writing uuid;
  st_interview uuid; st_study uuid; st_routine uuid; st_meal uuid; st_rest uuid;
  st_move uuid; st_comm uuid;
  t_rls uuid; t_aws uuid; t_scope uuid; t_interview uuid; t_docs uuid;
  t_finance uuid; t_port uuid; t_tax uuid;
  e3 uuid; e5 uuid; e6 uuid; e9 uuid; e10 uuid; e13 uuid;
begin
  select id into v_user from auth.users order by created_at limit 1;
  if v_user is null then
    raise exception '사용자가 없습니다. 먼저 로그인(가입)한 뒤 실행하세요.';
  end if;

  -- 프로젝트
  insert into public.projects (user_id, name, org_name, status, color)
  values (v_user, 'Daily Report Web', 'Personal', 'active', '#5e6ad2')
  returning id into p_dr;
  insert into public.projects (user_id, name, org_name, status, color)
  values (v_user, '소리교육 MVP', 'Abitus21', 'active', '#3a9690')
  returning id into p_edu;
  insert into public.projects (user_id, name, org_name, status, color)
  values (v_user, '소리기억 사업계획서', 'Abitus21', 'active', '#2a7a55')
  returning id into p_plan;
  insert into public.projects (user_id, name, org_name, status, color)
  values (v_user, '구직/면접', 'Personal', 'active', '#c9812f')
  returning id into p_job;
  insert into public.projects (user_id, name, org_name, status, color)
  values (v_user, '포트폴리오 리디자인', 'Personal', 'active', '#8a63c9')
  returning id into p_port;

  -- 서브타입 (기본 예시)
  insert into public.subtypes (user_id, type_key, name) values (v_user, 'work', 'Admin') returning id into st_admin;
  insert into public.subtypes (user_id, type_key, name) values (v_user, 'work', 'Development') returning id into st_dev;
  insert into public.subtypes (user_id, type_key, name) values (v_user, 'work', 'Design') returning id into st_design;
  insert into public.subtypes (user_id, type_key, name) values (v_user, 'work', 'Planning') returning id into st_planning;
  insert into public.subtypes (user_id, type_key, name) values (v_user, 'work', 'Writing') returning id into st_writing;
  insert into public.subtypes (user_id, type_key, name) values (v_user, 'work', 'Meeting');
  insert into public.subtypes (user_id, type_key, name) values (v_user, 'work', 'Research');
  insert into public.subtypes (user_id, type_key, name) values (v_user, 'learning_growth', 'Interview Prep') returning id into st_interview;
  insert into public.subtypes (user_id, type_key, name) values (v_user, 'learning_growth', '학습') returning id into st_study;
  insert into public.subtypes (user_id, type_key, name) values (v_user, 'learning_growth', 'Reading');
  insert into public.subtypes (user_id, type_key, name) values (v_user, 'health_exercise', '아침 루틴') returning id into st_routine;
  insert into public.subtypes (user_id, type_key, name) values (v_user, 'health_exercise', '산책');
  insert into public.subtypes (user_id, type_key, name) values (v_user, 'health_exercise', '헬스');
  insert into public.subtypes (user_id, type_key, name) values (v_user, 'meal_life', '식사') returning id into st_meal;
  insert into public.subtypes (user_id, type_key, name) values (v_user, 'meal_life', '장보기');
  insert into public.subtypes (user_id, type_key, name) values (v_user, 'sleep_rest', '휴식') returning id into st_rest;
  insert into public.subtypes (user_id, type_key, name) values (v_user, 'sleep_rest', '수면');
  insert into public.subtypes (user_id, type_key, name) values (v_user, 'relationship_communication', '커뮤니케이션') returning id into st_comm;
  insert into public.subtypes (user_id, type_key, name) values (v_user, 'travel_waiting', '이동') returning id into st_move;

  -- To-do
  insert into public.tasks (user_id, project_id, title, list, priority, status, due_date, estimated_minutes)
  values (v_user, p_dr, 'RLS 정책 초안 작성', 'today', 'high', 'in_progress', v_date, 60)
  returning id into t_rls;
  insert into public.tasks (user_id, project_id, title, list, priority, status, due_date, estimated_minutes, completed_at)
  values (v_user, p_dr, 'AWS 비용 리소스 정리', 'today', 'medium', 'done', v_date, 45, v_date::timestamptz + interval '9 hours')
  returning id into t_aws;
  insert into public.tasks (user_id, project_id, title, list, priority, status, due_date, estimated_minutes)
  values (v_user, p_edu, 'MVP 스코프 확정', 'today', 'high', 'not_started', v_date, 90)
  returning id into t_scope;
  insert into public.tasks (user_id, project_id, title, list, priority, status, due_date, estimated_minutes)
  values (v_user, p_job, '면접 답변 정리', 'today', 'medium', 'in_progress', v_date, 45)
  returning id into t_interview;
  insert into public.tasks (user_id, project_id, title, list, priority, status, due_date, estimated_minutes)
  values (v_user, p_dr, '디자인 시스템 문서화', 'today', 'low', 'in_progress', v_date, 60)
  returning id into t_docs;
  insert into public.tasks (user_id, project_id, title, list, priority, status, estimated_minutes)
  values (v_user, p_plan, '사업계획서 재무 모델', 'backlog', 'medium', 'not_started', 120)
  returning id into t_finance;
  insert into public.tasks (user_id, project_id, title, list, priority, status, estimated_minutes)
  values (v_user, p_port, '포트폴리오 케이스 3건 정리', 'backlog', 'medium', 'not_started', 180)
  returning id into t_port;
  insert into public.tasks (user_id, project_id, title, list, priority, status, estimated_minutes)
  values (v_user, p_dr, '세무 정산 서류 제출', 'backlog', 'medium', 'not_started', 30)
  returning id into t_tax;

  -- Entry
  insert into public.entries (user_id, report_date, start_at, end_at, type_key, subtype_id, project_id, content, status, tags)
  values
    (v_user, v_date, (v_date + time '07:10') at time zone v_tz, (v_date + time '07:45') at time zone v_tz, 'health_exercise', st_routine, null, '스트레칭 + 가벼운 조깅', 'done', '{루틴}'),
    (v_user, v_date, (v_date + time '07:45') at time zone v_tz, (v_date + time '08:20') at time zone v_tz, 'meal_life', st_meal, null, '아침 식사 · 뉴스레터 확인', 'done', '{}');

  insert into public.entries (user_id, report_date, start_at, end_at, type_key, subtype_id, project_id, content, status, tags)
  values (v_user, v_date, (v_date + time '08:30') at time zone v_tz, (v_date + time '09:15') at time zone v_tz, 'work', st_admin, null,
          'AWS RDS·S3 미사용 리소스 정리, 비용 알림 확인 및 예산 알람 임계값 조정', 'done', '{infra,비용}')
  returning id into e3;

  insert into public.entries (user_id, report_date, start_at, end_at, type_key, subtype_id, project_id, content, status, tags)
  values (v_user, v_date, (v_date + time '09:15') at time zone v_tz, (v_date + time '09:40') at time zone v_tz, 'work', st_admin, null,
          '세무 대리인 문의 회신 · 4대보험 관련 확인', 'done', '{세무}');

  insert into public.entries (user_id, report_date, start_at, end_at, type_key, subtype_id, project_id, content, status, tags)
  values (v_user, v_date, (v_date + time '09:45') at time zone v_tz, (v_date + time '11:15') at time zone v_tz, 'work', st_dev, p_dr,
          'Supabase Auth 구조 검토 및 RLS 정책 메모. 유저별 행 접근 정책과 프로젝트 공유 시나리오 정리.', 'in_progress', '{backend,auth}')
  returning id into e5;

  insert into public.entries (user_id, report_date, start_at, end_at, type_key, subtype_id, project_id, content, status, tags)
  values (v_user, v_date, (v_date + time '11:15') at time zone v_tz, (v_date + time '12:00') at time zone v_tz, 'work', st_design, p_dr,
          'Type pill 색상 시스템 정리, 우측 패널 밀도 조정', 'in_progress', '{design-system}')
  returning id into e6;

  insert into public.entries (user_id, report_date, start_at, end_at, type_key, subtype_id, project_id, content, status, tags)
  values
    (v_user, v_date, (v_date + time '12:00') at time zone v_tz, (v_date + time '12:50') at time zone v_tz, 'meal_life', st_meal, null, '점심 식사', 'done', '{}'),
    (v_user, v_date, (v_date + time '12:50') at time zone v_tz, (v_date + time '13:10') at time zone v_tz, 'sleep_rest', st_rest, null, '짧은 낮잠 · 눈 휴식', 'done', '{}');

  insert into public.entries (user_id, report_date, start_at, end_at, type_key, subtype_id, project_id, content, status, tags)
  values (v_user, v_date, (v_date + time '13:15') at time zone v_tz, (v_date + time '14:35') at time zone v_tz, 'work', st_planning, p_edu,
          '온보딩 플로우 와이어프레임, 기능 우선순위 정리', 'in_progress', '{mvp}')
  returning id into e9;

  -- 시간 겹침 데모 (13:15–14:35와 겹침) + paused
  insert into public.entries (user_id, report_date, start_at, end_at, type_key, subtype_id, project_id, content, status, tags)
  values (v_user, v_date, (v_date + time '14:30') at time zone v_tz, (v_date + time '15:30') at time zone v_tz, 'work', st_writing, p_plan,
          '시장 분석 섹션 초안, 경쟁사 비교표 작성', 'paused', '{문서}')
  returning id into e10;

  insert into public.entries (user_id, report_date, start_at, end_at, type_key, subtype_id, project_id, content, status, tags)
  values
    (v_user, v_date, (v_date + time '15:30') at time zone v_tz, (v_date + time '15:45') at time zone v_tz, 'travel_waiting', st_move, null, '카페 이동 · 대기', 'done', '{}'),
    (v_user, v_date, (v_date + time '15:45') at time zone v_tz, (v_date + time '16:40') at time zone v_tz, 'learning_growth', st_study, null, 'Postgres RLS 정책 패턴 학습 (문서)', 'done', '{study}');

  insert into public.entries (user_id, report_date, start_at, end_at, type_key, subtype_id, project_id, content, status, tags)
  values (v_user, v_date, (v_date + time '16:45') at time zone v_tz, (v_date + time '17:40') at time zone v_tz, 'work', st_interview, p_job,
          '포트폴리오 케이스 스터디 정리, 예상 질문 답변', 'in_progress', '{면접}')
  returning id into e13;

  insert into public.entries (user_id, report_date, start_at, end_at, type_key, subtype_id, project_id, content, status, tags)
  values
    (v_user, v_date, (v_date + time '17:40') at time zone v_tz, (v_date + time '18:00') at time zone v_tz, 'relationship_communication', st_comm, p_edu, '협업자와 소리교육 일정 논의', 'done', '{}'),
    (v_user, v_date, (v_date + time '18:00') at time zone v_tz, (v_date + time '18:50') at time zone v_tz, 'meal_life', st_meal, null, '저녁 식사', 'done', '{}');

  -- blocked 데모
  insert into public.entries (user_id, report_date, start_at, end_at, type_key, subtype_id, project_id, content, status, tags)
  values (v_user, v_date, (v_date + time '19:00') at time zone v_tz, (v_date + time '20:15') at time zone v_tz, 'work', st_design, p_port,
          '케이스 스터디 레이아웃 리디자인', 'blocked', '{자료대기}');

  insert into public.entries (user_id, report_date, start_at, end_at, type_key, subtype_id, project_id, content, status, tags)
  values (v_user, v_date, (v_date + time '21:00') at time zone v_tz, (v_date + time '22:00') at time zone v_tz, 'learning_growth', st_study, p_dr,
          '디자인 시스템 문서화 · 하루 회고', 'in_progress', '{docs}');

  -- Entry <-> To-do 연결
  insert into public.entry_tasks (entry_id, task_id, user_id) values
    (e3, t_aws, v_user),
    (e5, t_rls, v_user),
    (e6, t_docs, v_user),
    (e9, t_scope, v_user),
    (e13, t_interview, v_user);

  -- 한 Entry에 여러 링크 (안전한 데모 URL만 사용)
  insert into public.entry_links (user_id, entry_id, title, url, memo) values
    (v_user, e5, 'Supabase RLS Docs', 'https://supabase.com/docs/guides/auth/row-level-security', '정책 예시 참고'),
    (v_user, e5, 'Design Export', 'https://example.com/design/daily-report', null),
    (v_user, e5, 'Billing Console', 'https://example.com/billing', null),
    (v_user, e3, 'Billing Console', 'https://example.com/billing', null);

  -- Entry 단위 KPT+
  insert into public.kpt_notes (user_id, entry_id, keep_text, problem_text, try_text, plus_text) values
    (v_user, e5,
     'RLS 정책을 먼저 정리한 뒤 테이블 구조를 보니 개발 범위가 명확해졌다.',
     'To-do와 Entry 연결 방식이 아직 복잡하다. 드래그 앤 드롭은 MVP에서 과할 수 있다.',
     'MVP에서는 Related To-do 검색/선택 방식으로 먼저 구현하고, DnD는 이후로 미룬다.',
     'Plus 메모를 To-do로 전환하는 기능은 회고와 실행을 연결하는 핵심 루프가 될 수 있다.'),
    (v_user, e9,
     '와이어프레임을 먼저 그리니 기능 우선순위 논의가 빨라졌다.', '',
     '다음엔 사용자 시나리오를 먼저 정리하고 화면을 그린다.', ''),
    (v_user, e13,
     '', '답변이 길어짐. 핵심 3가지로 압축이 필요.', 'STAR 구조로 답변을 다시 정리한다.', '');
end $$;
