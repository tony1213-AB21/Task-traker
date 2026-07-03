import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Report",
  description: "실제 시간 사용을 기록하는 개인 운영 로그",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
