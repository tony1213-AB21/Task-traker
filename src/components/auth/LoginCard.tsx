"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Phase = "input" | "sent";

export default function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error"); // "confirm" | "oauth" | null

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [showEmail, setShowEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setGoogleLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setGoogleLoading(false);
      setError("Google 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.");
    }
    // 성공 시 브라우저가 Google로 리다이렉트됨
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    setLoading(false);
    if (error) {
      if (error.status === 429 || /rate limit/i.test(error.message)) {
        setError(
          "Supabase 이메일 발송 제한에 걸렸습니다. Google 로그인을 사용하거나 잠시 후 다시 시도하세요."
        );
      } else {
        setError("로그인 링크 전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
      return;
    }
    setPhase("sent");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp.trim(),
      type: "email",
    });
    setLoading(false);
    if (error) {
      setError("인증 코드가 올바르지 않거나 만료되었습니다.");
      return;
    }
    router.replace("/app");
  }

  return (
    <div className="w-full max-w-[400px] rounded-2xl border border-line bg-surface p-8 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
      <div className="mb-1 flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" />
        <h1 className="text-[17px] font-semibold text-ink-strong">
          Daily Report
        </h1>
      </div>
      <p className="mb-7 text-[13px] text-ink-muted">
        실제 시간 사용을 기록하는 개인 운영 로그
      </p>

      {/* URL로 전달된 콜백 오류 */}
      {urlError && !error && (
        <p className="mb-4 rounded-lg border border-[#f0e4cf] bg-[#fbf6ee] px-3 py-2 text-[12.5px] text-[#77621f]">
          {urlError === "oauth"
            ? "Google 로그인에 실패했습니다. 다시 시도해주세요."
            : "로그인 링크 확인에 실패했습니다. 다시 요청해주세요."}
        </p>
      )}

      {/* Primary: Google */}
      <button
        onClick={signInWithGoogle}
        disabled={googleLoading}
        className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-2.5 text-[13.5px] font-semibold text-ink transition hover:bg-surface-alt disabled:opacity-60"
      >
        <GoogleIcon />
        {googleLoading ? "이동 중..." : "Google로 계속하기"}
      </button>

      {error && (
        <p className="mt-4 text-[12.5px] leading-relaxed text-[#9a3b32]">
          {error}
        </p>
      )}

      {/* Secondary: 이메일 로그인 (접힌 보조 옵션) */}
      {!showEmail ? (
        <button
          onClick={() => {
            setShowEmail(true);
            setError(null);
          }}
          className="mt-5 w-full text-center text-[12.5px] text-ink-muted underline-offset-2 transition hover:text-ink-mid hover:underline"
        >
          이메일로 로그인
        </button>
      ) : (
        <div className="mt-5 border-t border-line pt-5">
          {phase === "input" && (
            <form onSubmit={sendLink}>
              <h2 className="mb-1.5 text-[14px] font-semibold text-ink-strong">
                이메일로 로그인
              </h2>
              <p className="mb-3 text-[12px] leading-relaxed text-ink-muted">
                입력한 이메일로 로그인 링크를 보내드립니다.
              </p>
              <label
                htmlFor="email"
                className="mb-1.5 block text-[12px] font-medium text-ink-soft"
              >
                이메일
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mb-3 w-full rounded-lg border border-line px-3 py-2 text-[13.5px] text-ink outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_rgba(94,106,210,0.16)]"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
              >
                {loading ? "전송 중..." : "로그인 링크 보내기"}
              </button>
              <p className="mt-3 text-center text-[11.5px] text-ink-faint">
                로그인 링크는 일정 시간 동안만 유효합니다.
              </p>
            </form>
          )}

          {phase === "sent" && (
            <form onSubmit={verifyCode}>
              <h2 className="mb-1.5 text-[14px] font-semibold text-ink-strong">
                이메일을 확인해주세요
              </h2>
              <p className="mb-3 text-[12px] leading-relaxed text-ink-muted">
                <span className="font-medium text-ink">{email}</span> 로 로그인
                링크를 보냈습니다. 메일의 링크를 열거나, 메일에 포함된 인증 코드를
                입력하세요.
              </p>
              <label
                htmlFor="otp"
                className="mb-1.5 block text-[12px] font-medium text-ink-soft"
              >
                인증 코드 (선택)
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="mb-3 w-full rounded-lg border border-line px-3 py-2 text-[13.5px] tracking-widest text-ink outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_rgba(94,106,210,0.16)]"
              />
              <button
                type="submit"
                disabled={loading || !otp.trim()}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
              >
                {loading ? "확인 중..." : "코드로 로그인"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhase("input");
                  setOtp("");
                  setError(null);
                }}
                className="mt-2 w-full rounded-lg px-4 py-2 text-[12.5px] text-ink-muted transition hover:bg-line-soft"
              >
                다른 이메일로 보내기
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
