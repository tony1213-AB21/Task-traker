// FAT32 드라이브 워크어라운드를 적용해 next CLI를 실행한다.
// NODE_OPTIONS --require 는 빌드 워커 자식 프로세스에도 상속된다.
"use strict";

const path = require("path");
const { spawnSync } = require("child_process");

// NODE_OPTIONS는 백슬래시를 이스케이프로 해석하므로 슬래시 경로를 사용한다.
const fix = path
  .resolve(__dirname, "fat32-readlink-fix.cjs")
  .replace(/\\/g, "/");
const nodeOptions = [process.env.NODE_OPTIONS, `--require "${fix}"`]
  .filter(Boolean)
  .join(" ");

const nextBin = require.resolve("next/dist/bin/next");
const result = spawnSync(
  process.execPath,
  [nextBin, ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: { ...process.env, NODE_OPTIONS: nodeOptions },
  }
);

process.exit(result.status ?? 1);
