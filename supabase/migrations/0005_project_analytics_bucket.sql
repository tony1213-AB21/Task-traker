-- KAN-32: 프로젝트 → Analytics 안전 버킷 매핑
-- project_type 이벤트 속성용 (Analytics Spec 4.1.1).
-- 실제 프로젝트명/회사명은 이벤트에 전송하지 않고 이 버킷 값만 전송한다.
-- 허용 값: ab21 / company / sorimemory / soriedu / kuji / etc

alter table public.projects
  add column if not exists analytics_bucket text not null default 'etc';
