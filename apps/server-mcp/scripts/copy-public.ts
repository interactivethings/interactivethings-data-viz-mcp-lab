// @ts-nocheck
import { cp, mkdir } from "node:fs/promises";
import path from "node:path";

const sourceDir = path.resolve("public");
const destinationRoot = path.resolve("dist");
const destinationDir = path.resolve("dist/public");

await mkdir(destinationRoot, { recursive: true });
await cp(sourceDir, destinationDir, {
  recursive: true,
  force: true,
});
