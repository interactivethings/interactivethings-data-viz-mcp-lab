import { BoxPlotWidgetPayload } from "@repo/domain/Chart";
import { Effect, FileSystem, Path } from "effect";
import { makeUiRenderTool, makeUiResource } from "../../UiResource";

const BoxPlotWidgetResourceUri = "ui://box-plot";

const BoxPlotWidgetHtml = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const sourceSuffix = path.join("widget", "box-plot");
  const isSourcePath = import.meta.dir.endsWith(sourceSuffix);
  const htmlPath = isSourcePath
    ? path.join(import.meta.dir, "widget-box-plot.html")
    : path.join(import.meta.dir, "widget/box-plot/widget-box-plot.html");
  return yield* fs.readFileString(htmlPath);
});

export const BoxPlotWidgetResourceLayer = makeUiResource(
  BoxPlotWidgetResourceUri,
  {
    name: "Box Plot",
    description: "Box plot widget UI",
    html: BoxPlotWidgetHtml,
    meta: {
      prefersBorder: false,
    },
  },
);

export const RenderBoxPlotWidgetTool = makeUiRenderTool(
  BoxPlotWidgetResourceUri,
  {
    name: "render_box_plot_widget",
    title: "Box Plot",
    description: "Render the box plot widget UI",
    parameters: BoxPlotWidgetPayload,
    success: BoxPlotWidgetPayload,
  },
);

export const renderBoxPlotWidgetHandler = (
  payload: typeof BoxPlotWidgetPayload.Type,
) => Effect.succeed(payload);
