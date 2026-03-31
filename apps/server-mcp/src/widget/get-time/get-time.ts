import { join as joinPath } from "node:path";
import { Effect, FileSystem, Schema } from "effect";
import { Tool } from "effect/unstable/ai";
import { makeUiRenderTool, makeUiResource } from "../../UiResource";

const GetTimeUiResourceUri = "ui://get-time";

const GetTimeHtml = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const sourceSuffix = joinPath("widget", "get-time");
  const isSourcePath = import.meta.dir.endsWith(sourceSuffix);
  const htmlPath = isSourcePath
    ? joinPath(import.meta.dir, "get-time.html")
    : joinPath(import.meta.dir, "widget/get-time/get-time.html");
  return yield* fs.readFileString(htmlPath);
});

export const GetTimeResourceLayer = makeUiResource(GetTimeUiResourceUri, {
  name: "Get Time",
  description: "Get time UI",
  html: GetTimeHtml,
  meta: {
    prefersBorder: false,
    csp: {
      resourceDomains: ["https://cdn.jsdelivr.net"],
    },
  },
  withAppsSdk: true,
});

export const RenderGetTimeTool = makeUiRenderTool(GetTimeUiResourceUri, {
  name: "render_get_time",
  title: "Get Time",
  description: "Render the get time UI",
  parameters: Tool.EmptyParams,
  success: Schema.String,
  openai: {
    toolInvocation: {
      invoking: "Loading time widget...",
      invoked: "Time widget ready",
    },
  },
});

export const renderGetTimeHandler = () =>
  Effect.succeed("Get time ready. Use the UI to refresh.");

export const GetTimeTool = Tool.make("get_time", {
  description: "Returns the current server time",
  parameters: Tool.EmptyParams,
  success: Schema.String,
  failure: Schema.Never,
}).annotate(Tool.Title, "Get Time");

export const getTimeHandler = () => Effect.sync(() => new Date().toISOString());
