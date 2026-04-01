import { BarChartWidgetPayload } from "@repo/domain/Chart";
import { Effect, FileSystem, Path } from "effect";
import { makeUiRenderTool, makeUiResource } from "../../UiResource";

const BarChartWidgetResourceUri = "ui://bar-chart";

const BarChartWidgetHtml = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const sourceSuffix = path.join("widget", "bar-chart");
  const isSourcePath = import.meta.dir.endsWith(sourceSuffix);
  const htmlPath = isSourcePath
    ? path.join(import.meta.dir, "widget-bar-chart.html")
    : path.join(import.meta.dir, "widget/bar-chart/widget-bar-chart.html");
  return yield* fs.readFileString(htmlPath);
});

export const BarChartWidgetResourceLayer = makeUiResource(
  BarChartWidgetResourceUri,
  {
    name: "Bar Chart",
    description: "Bar chart widget UI",
    html: BarChartWidgetHtml,
    meta: {
      prefersBorder: false,
    },
  },
);

export const RenderBarChartWidgetTool = makeUiRenderTool(
  BarChartWidgetResourceUri,
  {
    name: "render_bar_chart_widget",
    title: "Bar Chart",
    description: "Render the bar chart widget UI",
    parameters: BarChartWidgetPayload,
    success: BarChartWidgetPayload,
  },
);

export const renderBarChartWidgetHandler = (
  payload: typeof BarChartWidgetPayload.Type,
) => Effect.succeed(payload);
