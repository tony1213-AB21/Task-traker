"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Phase = "input" | "sent";

export default function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirmError = searchParams.get("error") === "confirm";

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError("로그인 링크 전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
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

      {phase === "input" && (
        <form onSubmit={sendLink}>
          <h2 className="mb-1.5 text-[15px] font-semibold text-ink-strong">
            이메일로 로그인
          </h2>
          <p className="mb-4 text-[12.5px] leading-relaxed text-ink-muted">
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
            className="mb-4 w-full rounded-lg border border-line px-3 py-2 text-[13.5px] text-ink outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_rgba(94,106,210,0.16)]"
          />
          {(error || confirmError) && (
            <p className="mb-3 text-[12.5px] text-[#9a3b32]">
              {error ??
                "로그인 링크 확인에 실패했습니다. 다시 요청해주세요."}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
          >
            {loading ? "전송 중..." : "로그인 링크 보내기"}
          </button>
          <p className="mt-4 text-center text-[11.5px] text-ink-faint">
            로그인 링크는 일정 시간 동안만 유효합니다.
          </p>
        </form>
      )}

      {phase === "sent" && (
        <form onSubmit={verifyCode}>
          <h2 className="mb-1.5 text-[15px] font-semibold text-ink-strong">
            이메일을 확인해주세요
          </h2>
          <p className="mb-4 text-[12.5px] leading-relaxed text-ink-muted">
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
            className="mb-4 w-full rounded-lg border border-line px-3 py-2 text-[13.5px] tracking-widest text-ink outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_rgba(94,106,210,0.16)]"
          />
          {error && (
            <p className="mb-3 text-[12.5px] text-[#9a3b32]">{error}</p>
          )}
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
  );
}
