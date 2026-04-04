import { TreemapWidgetPayload } from "@repo/domain/Chart";
import { Effect, FileSystem, Path } from "effect";
import { makeUiRenderTool, makeUiResource } from "../../UiResource";

const TreemapWidgetResourceUri = "ui://treemap";

const TreemapWidgetHtml = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const sourceSuffix = path.join("widget", "treemap");
  const isSourcePath = import.meta.dir.endsWith(sourceSuffix);
  const htmlPath = isSourcePath
    ? path.join(import.meta.dir, "widget-treemap.html")
    : path.join(import.meta.dir, "widget/treemap/widget-treemap.html");
  return yield* fs.readFileString(htmlPath);
});

export const TreemapWidgetResourceLayer = makeUiResource(
  TreemapWidgetResourceUri,
  {
    name: "Treemap",
    description: "Treemap widget UI",
    html: TreemapWidgetHtml,
    meta: {
      prefersBorder: false,
    },
  },
);

export const RenderTreemapWidgetTool = makeUiRenderTool(
  TreemapWidgetResourceUri,
  {
    name: "render_treemap_widget",
    title: "Treemap",
    description: "Render the treemap widget UI",
    parameters: TreemapWidgetPayload,
    success: TreemapWidgetPayload,
  },
);

export const renderTreemapWidgetHandler = (
  payload: typeof TreemapWidgetPayload.Type,
) => Effect.succeed(payload);
