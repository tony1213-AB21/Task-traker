"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Production 기본 로그인: Google OAuth 전용.
// 이메일 발송(magic link/OTP)은 rate limit 때문에 로그인 UI에서 사용하지 않는다.
export default function LoginCard() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error"); // "oauth" | null

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
    // 성공 시 브라우저가 Google 동의 화면으로 리다이렉트됨
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

      <button
        onClick={signInWithGoogle}
        disabled={googleLoading}
        className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-2.5 text-[13.5px] font-semibold text-ink transition hover:bg-surface-alt disabled:opacity-60"
      >
        <GoogleIcon />
        {googleLoading ? "이동 중..." : "Google로 계속하기"}
      </button>

      {(error || urlError === "oauth") && (
        <p className="mt-4 text-[12.5px] leading-relaxed text-[#9a3b32]">
          {error ?? "Google 로그인에 실패했습니다. 다시 시도해주세요."}
        </p>
      )}

      <p className="mt-6 text-center text-[11.5px] leading-relaxed text-ink-faint">
        계속하면 Google 계정으로 로그인합니다.
      </p>
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
