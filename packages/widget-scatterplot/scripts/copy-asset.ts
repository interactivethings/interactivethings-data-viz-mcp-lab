// @ts-nocheck
import { existsSync, watch } from "node:fs";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

const mode = process.argv[2];
const shouldWatch = process.argv.includes("--watch");

if (mode !== "build" && mode !== "dev") {
  console.error("Usage: bun scripts/copy-asset.ts <build|dev> [--watch]");
  process.exit(1);
}

const sourcePath = path.resolve("dist/index.html");
const destinationDir = path.resolve(
  mode === "dev"
    ? "../../apps/server-mcp/public/widgets"
    : "../../apps/server-mcp/dist/public/widgets",
);
const destinationPath = path.join(destinationDir, "widget-scatterplot.html");

const waitForSource = async () => {
  if (existsSync(sourcePath)) {
    return;
  }

  await new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (existsSync(sourcePath)) {
        clearInterval(interval);
        resolve();
      }
    }, 200);
  });
};

const copyOnce = async () => {
  await mkdir(destinationDir, { recursive: true });
  await copyFile(sourcePath, destinationPath);
};

const copyAfterBuild = async () => {
  await waitForSource();
  await copyOnce();
};

if (shouldWatch) {
  await copyAfterBuild();

  watch(
    path.dirname(sourcePath),
    { persistent: true },
    async (_event, file) => {
      if (file === path.basename(sourcePath)) {
        await copyOnce();
      }
    },
  );
} else {
  await copyAfterBuild();
}
