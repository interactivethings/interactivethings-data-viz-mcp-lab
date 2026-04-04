import { HeatmapWidgetPayload } from "@repo/domain/Chart";
import { Effect, FileSystem, Path } from "effect";
import { makeUiRenderTool, makeUiResource } from "../../UiResource";

const HeatmapWidgetResourceUri = "ui://heatmap";

const HeatmapWidgetHtml = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const sourceSuffix = path.join("widget", "heatmap");
  const isSourcePath = import.meta.dir.endsWith(sourceSuffix);
  const htmlPath = isSourcePath
    ? path.join(import.meta.dir, "widget-heatmap.html")
    : path.join(import.meta.dir, "widget/heatmap/widget-heatmap.html");
  return yield* fs.readFileString(htmlPath);
});

export const HeatmapWidgetResourceLayer = makeUiResource(
  HeatmapWidgetResourceUri,
  {
    name: "Heatmap",
    description: "Heatmap widget UI",
    html: HeatmapWidgetHtml,
    meta: {
      prefersBorder: false,
    },
  },
);

export const RenderHeatmapWidgetTool = makeUiRenderTool(
  HeatmapWidgetResourceUri,
  {
    name: "render_heatmap_widget",
    title: "Heatmap",
    description: "Render the heatmap widget UI",
    parameters: HeatmapWidgetPayload,
    success: HeatmapWidgetPayload,
  },
);

export const renderHeatmapWidgetHandler = (
  payload: typeof HeatmapWidgetPayload.Type,
) => Effect.succeed(payload);
