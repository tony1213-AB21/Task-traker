import { Suspense } from "react";
import LoginCard from "@/components/auth/LoginCard";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <Suspense>
        <LoginCard />
      </Suspense>
    </main>
  );
}
