// GitHub Pages는 모르는 경로에 404.html을 보여 준다. index.html을 그대로 복사해 두면
// /62dn/animals/3 같은 주소를 새로고침해도 앱이 뜨고 라우터가 화면을 정한다.
import { copyFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dist = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");
if (!existsSync(resolve(dist, "index.html"))) {
  console.error("dist/index.html이 없습니다. 빌드 뒤에 실행하세요.");
  process.exit(1);
}
copyFileSync(resolve(dist, "index.html"), resolve(dist, "404.html"));
console.log("dist/404.html을 만들었습니다.");
