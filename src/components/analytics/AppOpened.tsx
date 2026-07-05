"use client";

// app_opened 발화 (KAN-13): 앱 첫 로드 완료 시 1회.
// 루트 레이아웃에 마운트되며, 전체 페이지 로드당 한 번만 발화한다.

import { useEffect } from "react";
import { track } from "@/lib/analytics/track";

// StrictMode 이중 mount에도 1회만 발화되도록 모듈 레벨 가드
let fired = false;

export default function AppOpened() {
  useEffect(() => {
    if (fired) return;
    fired = true;
    track("app_opened");
  }, []);
  return null;
}
