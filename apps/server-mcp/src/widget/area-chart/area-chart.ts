import { AreaChartWidgetPayload } from "@repo/domain/Chart";
import { Effect, FileSystem, Path } from "effect";
import { makeUiRenderTool, makeUiResource } from "../../UiResource";

const AreaChartWidgetResourceUri = "ui://area-chart";

const AreaChartWidgetHtml = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const sourceSuffix = path.join("widget", "area-chart");
  const isSourcePath = import.meta.dir.endsWith(sourceSuffix);
  const htmlPath = isSourcePath
    ? path.join(import.meta.dir, "widget-area-chart.html")
    : path.join(import.meta.dir, "widget/area-chart/widget-area-chart.html");
  return yield* fs.readFileString(htmlPath);
});

export const AreaChartWidgetResourceLayer = makeUiResource(
  AreaChartWidgetResourceUri,
  {
    name: "Area Chart",
    description: "Area chart widget UI",
    html: AreaChartWidgetHtml,
    meta: {
      prefersBorder: false,
    },
  },
);

export const RenderAreaChartWidgetTool = makeUiRenderTool(
  AreaChartWidgetResourceUri,
  {
    name: "render_area_chart_widget",
    title: "Area Chart",
    description: "Render the area chart widget UI",
    parameters: AreaChartWidgetPayload,
    success: AreaChartWidgetPayload,
  },
);

export const renderAreaChartWidgetHandler = (
  payload: typeof AreaChartWidgetPayload.Type,
) => Effect.succeed(payload);
