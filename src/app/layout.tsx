import type { Metadata } from "next";
import "./globals.css";
import AppOpened from "@/components/analytics/AppOpened";

export const metadata: Metadata = {
  title: "Daily Report",
  description: "실제 시간 사용을 기록하는 개인 운영 로그",
};

// GA4 measurement ID가 없으면 스크립트를 싣지 않고 track()은 no-op으로 동작한다 (KAN-13)
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      {GA_ID && (
        <head>
          {/* gtag를 동기로 정의해 이후 track() 호출이 로더 완료 전에도 큐잉되게 한다 */}
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}',{send_page_view:false});`,
            }}
          />
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          />
        </head>
      )}
      <body>
        <AppOpened />
        {children}
      </body>
    </html>
  );
}
