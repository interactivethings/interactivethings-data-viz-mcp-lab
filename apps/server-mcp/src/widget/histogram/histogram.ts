import { HistogramWidgetPayload } from "@repo/domain/Chart";
import { Effect, FileSystem, Path } from "effect";
import { makeUiRenderTool, makeUiResource } from "../../UiResource";

const HistogramWidgetResourceUri = "ui://histogram";

const HistogramWidgetHtml = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const sourceSuffix = path.join("widget", "histogram");
  const isSourcePath = import.meta.dir.endsWith(sourceSuffix);
  const htmlPath = isSourcePath
    ? path.join(import.meta.dir, "widget-histogram.html")
    : path.join(import.meta.dir, "widget/histogram/widget-histogram.html");
  return yield* fs.readFileString(htmlPath);
});

export const HistogramWidgetResourceLayer = makeUiResource(
  HistogramWidgetResourceUri,
  {
    name: "Histogram",
    description: "Histogram widget UI",
    html: HistogramWidgetHtml,
    meta: {
      prefersBorder: false,
    },
  },
);

export const RenderHistogramWidgetTool = makeUiRenderTool(
  HistogramWidgetResourceUri,
  {
    name: "render_histogram_widget",
    title: "Histogram",
    description: "Render the histogram widget UI",
    parameters: HistogramWidgetPayload,
    success: HistogramWidgetPayload,
  },
);

export const renderHistogramWidgetHandler = (
  payload: typeof HistogramWidgetPayload.Type,
) => Effect.succeed(payload);
