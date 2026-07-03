import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth(Google) 로그인 콜백: authorization code를 세션으로 교환한 뒤 /app으로 보낸다.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");

  // 프록시(Vercel) 뒤에서는 x-forwarded-host가 실제 배포 도메인을 가리킨다.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";
  const base = !isLocal && forwardedHost ? `https://${forwardedHost}` : origin;

  if (!oauthError && code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${base}/app`);
    }
  }

  return NextResponse.redirect(`${base}/login?error=oauth`);
}
