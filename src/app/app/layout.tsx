import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// /app 이하 보호 라우트: middleware에 더해 서버에서도 세션을 확인한다.
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}
