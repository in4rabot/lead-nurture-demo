// Next.js "standalone" output traces only the JS needed to run the server —
// it does not copy the public/ folder or .next/static, so this must run
// after every build to make those assets available to the standalone server.
import { cpSync, existsSync } from "fs";
import path from "path";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");

if (!existsSync(standaloneDir)) {
  throw new Error(
    `.next/standalone not found — is "output: 'standalone'" set in next.config.ts?`
  );
}

cpSync(path.join(root, "public"), path.join(standaloneDir, "public"), {
  recursive: true,
});
cpSync(
  path.join(root, ".next", "static"),
  path.join(standaloneDir, ".next", "static"),
  { recursive: true }
);

console.log("Copied public/ and .next/static into .next/standalone/");
