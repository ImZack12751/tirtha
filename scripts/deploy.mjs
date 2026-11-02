// Builds the app and publishes dist/ to the gh-pages branch. Run with: npm run deploy
import { execSync } from "node:child_process";
import { mkdtempSync, cpSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: "inherit" });
const remote = execSync("git remote get-url origin").toString().trim();

run("npm run build");
const dir = mkdtempSync(join(tmpdir(), "tirtha-pages-"));
try {
  cpSync("dist", dir, { recursive: true });
  writeFileSync(join(dir, ".nojekyll"), "");
  run("git init -q -b gh-pages", dir);
  run("git add -A", dir);
  run(`git commit -q -m "Deploy ${new Date().toISOString()}"`, dir);
  run(`git push -q --force ${remote} gh-pages`, dir);
  console.log("Published to gh-pages");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
