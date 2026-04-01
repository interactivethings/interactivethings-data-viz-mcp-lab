import { LineChartWidgetPayload } from "@repo/domain/Chart";
import { Effect, FileSystem, Path } from "effect";
import { makeUiRenderTool, makeUiResource } from "../../UiResource";

const LineChartWidgetResourceUri = "ui://line-chart";

const LineChartWidgetHtml = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const sourceSuffix = path.join("widget", "line-chart");
  const isSourcePath = import.meta.dir.endsWith(sourceSuffix);
  const htmlPath = isSourcePath
    ? path.join(import.meta.dir, "widget-line-chart.html")
    : path.join(import.meta.dir, "widget/line-chart/widget-line-chart.html");
  return yield* fs.readFileString(htmlPath);
});

export const LineChartWidgetResourceLayer = makeUiResource(
  LineChartWidgetResourceUri,
  {
    name: "Line Chart",
    description: "Line chart widget UI",
    html: LineChartWidgetHtml,
    meta: {
      prefersBorder: false,
    },
  },
);

export const RenderLineChartWidgetTool = makeUiRenderTool(
  LineChartWidgetResourceUri,
  {
    name: "render_line_chart_widget",
    title: "Line Chart",
    description: "Render the line chart widget UI",
    parameters: LineChartWidgetPayload,
    success: LineChartWidgetPayload,
  },
);

export const renderLineChartWidgetHandler = (
  payload: typeof LineChartWidgetPayload.Type,
) => Effect.succeed(payload);
