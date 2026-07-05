// Daily Report 이벤트 트래킹 공통 유틸 (KAN-12).
// 이벤트명·속성·금지 규칙은 Confluence "Analytics Spec - Daily Report Events v1"을 따른다.
//
// 원칙:
// - v1 이벤트는 아래 9개뿐이다. 새 이벤트는 스펙 문서에 먼저 추가한 뒤 여기에 반영한다.
// - 모든 이벤트는 클릭 시점이 아니라 성공 기준(저장 성공, 화면 렌더 완료) 시점에 발생시킨다.
// - 자유 텍스트(content, title, memo 등)는 마스킹이 아니라 "미전송"이 원칙이다.
//   허용 목록에 없는 속성은 이 함수 레벨에서 버린다.

export const ANALYTICS_EVENTS = [
  "app_opened",
  "login_completed",
  "daily_report_viewed",
  "entry_create_started",
  "entry_saved",
  "todo_created",
  "todo_attached_to_entry",
  "kpt_saved",
  "analysis_viewed",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

// 스펙 4.1 허용 값. project_type의 회사 업무는 실제 회사명이 아니라 "company" 고정값만 쓴다.
export const PROJECT_TYPES = [
  "ab21",
  "company",
  "sorimemory",
  "soriedu",
  "kuji",
  "etc",
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const WORK_TYPES = [
  "dev",
  "planning",
  "meeting",
  "research",
  "retro",
  "etc",
] as const;
export type WorkType = (typeof WORK_TYPES)[number];

export const DURATION_BUCKETS = [
  "under_30m",
  "30m_1h",
  "1h_2h",
  "2h_4h",
  "over_4h",
] as const;
export type DurationBucket = (typeof DURATION_BUCKETS)[number];

// 이벤트별로 보낼 수 있는 속성 (스펙 4.1 "붙는 이벤트" 열).
// 공통 속성(date_bucket, device_type, user_role, env)은 track()이 자동으로 채운다.
export interface AnalyticsEventProps {
  app_opened: Record<string, never>;
  login_completed: Record<string, never>;
  daily_report_viewed: Record<string, never>;
  entry_create_started: Record<string, never>;
  entry_saved: {
    project_type?: ProjectType;
    work_type?: WorkType;
    has_todo?: boolean;
    has_kpt?: boolean;
    duration_bucket?: DurationBucket;
    entry_count?: number;
  };
  todo_created: { project_type?: ProjectType };
  todo_attached_to_entry: Record<string, never>;
  kpt_saved: Record<string, never>;
  analysis_viewed: { entry_count?: number };
}

// 런타임 허용 목록 (타입을 우회한 호출도 여기서 차단된다)
const EVENT_ALLOWED_PROPS: Record<AnalyticsEvent, readonly string[]> = {
  app_opened: [],
  login_completed: [],
  daily_report_viewed: [],
  entry_create_started: [],
  entry_saved: [
    "project_type",
    "work_type",
    "has_todo",
    "has_kpt",
    "duration_bucket",
    "entry_count",
  ],
  todo_created: ["project_type"],
  todo_attached_to_entry: [],
  kpt_saved: [],
  analysis_viewed: ["entry_count"],
};

// 문자열 속성은 허용 값 목록까지 검사한다 (임의 문자열이 새어 나가지 않게)
const ALLOWED_VALUES: Record<string, readonly string[]> = {
  project_type: PROJECT_TYPES,
  work_type: WORK_TYPES,
  duration_bucket: DURATION_BUCKETS,
};

type Primitive = string | number | boolean;

// Amplitude: API 키가 있을 때만 SDK를 lazy 로드해 앱 생명주기 동안 1회만 init한다.
// autocapture는 끈다 — 스펙 v1의 9개 이벤트만 보낸다. Session Replay 플러그인은 v1에서 쓰지 않는다.
const AMPLITUDE_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
let amplitudePromise: Promise<
  typeof import("@amplitude/analytics-browser")
> | null = null;

function getAmplitude() {
  if (!AMPLITUDE_KEY) return null;
  if (!amplitudePromise) {
    amplitudePromise = import("@amplitude/analytics-browser").then((m) => {
      m.init(AMPLITUDE_KEY, { autocapture: false });
      return m;
    });
  }
  return amplitudePromise;
}

function dateBucket(d: Date = new Date()): "weekday" | "weekend" {
  const day = d.getDay();
  return day === 0 || day === 6 ? "weekend" : "weekday";
}

function deviceType(): "desktop" | "mobile" | "tablet" {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

function envName(): "production" | "preview" | "development" {
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
  if (vercelEnv === "production" || vercelEnv === "preview") return vercelEnv;
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

export function durationBucket(minutes: number): DurationBucket {
  if (minutes < 30) return "under_30m";
  if (minutes < 60) return "30m_1h";
  if (minutes < 120) return "1h_2h";
  if (minutes < 240) return "2h_4h";
  return "over_4h";
}

/**
 * 유일한 이벤트 전송 함수. GA4(gtag)가 로드되어 있으면 전송하고, 아니면 no-op.
 * 성공 기준 시점(저장 성공 / 렌더 완료)에서만 호출한다. 실패 시에는 호출하지 않는다.
 */
export function track<E extends AnalyticsEvent>(
  event: E,
  props?: AnalyticsEventProps[E]
): void {
  if (typeof window === "undefined") return; // 클라이언트 전용

  const allowed = EVENT_ALLOWED_PROPS[event];
  const payload: Record<string, Primitive> = {};
  const dropped: string[] = [];

  for (const [key, raw] of Object.entries(props ?? {})) {
    if (!allowed.includes(key)) {
      dropped.push(key);
      continue;
    }
    if (typeof raw === "boolean" || (typeof raw === "number" && Number.isFinite(raw))) {
      payload[key] = raw;
    } else if (typeof raw === "string") {
      const values = ALLOWED_VALUES[key];
      if (values?.includes(raw)) {
        payload[key] = raw;
      } else if (key === "project_type" || key === "work_type") {
        // 허용 값 밖 문자열(예: 실제 회사/프로젝트명)은 원문 대신 etc로 강제
        payload[key] = "etc";
      } else {
        dropped.push(key);
      }
    } else {
      dropped.push(key); // 객체/배열/null 등은 전송하지 않는다
    }
  }

  // 공통 속성은 항상 함수가 채운다 (호출자가 덮어쓸 수 없음)
  payload.date_bucket = dateBucket();
  payload.device_type = deviceType();
  payload.user_role = "owner"; // v1은 단일 사용자
  payload.env = envName();

  if (dropped.length > 0) {
    console.warn(
      `[analytics] 허용 목록 밖 속성을 차단했습니다: ${event} → ${dropped.join(", ")}`
    );
  }

  // GA4 + Amplitude 동시 전송. 각각 키가 설정된 경우에만 동작한다.
  let delivered = false;

  const w = window as Window & { gtag?: (...args: unknown[]) => void };
  if (w.gtag) {
    w.gtag("event", event, payload);
    delivered = true;
  }

  const amplitude = getAmplitude();
  if (amplitude) {
    amplitude
      .then((m) => m.track(event, payload))
      .catch((e) => console.warn("[analytics] Amplitude 전송 실패:", e));
    delivered = true;
  }

  if (!delivered && payload.env !== "production") {
    // 둘 다 미연결 상태에서는 개발 환경 로그만 남긴다
    console.debug("[analytics]", event, payload);
  }
}
