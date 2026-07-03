// FAT32/exFAT 드라이브 위에서 Node의 fs.readlink가 일반 파일에 대해
// EINVAL 대신 EISDIR을 반환해 Next.js(webpack/파일 트레이싱) 빌드가 깨진다.
// EISDIR을 EINVAL("심볼릭 링크가 아님")로 바꿔 호출자가 정상 처리하게 한다.
// NTFS 등 정상 파일시스템에서는 아무 영향이 없다.
"use strict";

const fs = require("fs");

function toEinval(err) {
  if (err && err.code === "EISDIR" && err.syscall === "readlink") {
    err.code = "EINVAL";
    err.errno = -4071; // UV_EINVAL (Windows)
    err.message = err.message.replace("EISDIR", "EINVAL");
  }
  return err;
}

const origReadlink = fs.readlink;
fs.readlink = function readlink(path, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = undefined;
  }
  return origReadlink.call(fs, path, options, (err, result) => {
    callback(toEinval(err), result);
  });
};

const origReadlinkSync = fs.readlinkSync;
fs.readlinkSync = function readlinkSync(path, options) {
  try {
    return origReadlinkSync.call(fs, path, options);
  } catch (err) {
    throw toEinval(err);
  }
};

const origPromisesReadlink = fs.promises.readlink;
fs.promises.readlink = async function readlink(path, options) {
  try {
    return await origPromisesReadlink.call(fs.promises, path, options);
  } catch (err) {
    throw toEinval(err);
  }
};
