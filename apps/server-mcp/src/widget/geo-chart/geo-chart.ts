import { GeoChartWidgetPayload } from "@repo/domain/Chart";
import { Effect, FileSystem, Path } from "effect";
import { makeUiRenderTool, makeUiResource } from "../../UiResource";

const GeoChartWidgetResourceUri = "ui://geo-chart";

const GeoChartWidgetHtml = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const sourceSuffix = path.join("widget", "geo-chart");
  const isSourcePath = import.meta.dir.endsWith(sourceSuffix);
  const htmlPath = isSourcePath
    ? path.join(import.meta.dir, "widget-geo-chart.html")
    : path.join(import.meta.dir, "widget/geo-chart/widget-geo-chart.html");
  return yield* fs.readFileString(htmlPath);
});

export const GeoChartWidgetResourceLayer = makeUiResource(
  GeoChartWidgetResourceUri,
  {
    name: "Geo Chart",
    description: "Geo chart widget UI",
    html: GeoChartWidgetHtml,
    meta: {
      prefersBorder: false,
    },
  },
);

export const RenderGeoChartWidgetTool = makeUiRenderTool(
  GeoChartWidgetResourceUri,
  {
    name: "render_geo_chart_widget",
    title: "Geo Chart",
    description: "Render the geo chart widget UI",
    parameters: GeoChartWidgetPayload,
    success: GeoChartWidgetPayload,
  },
);

export const renderGeoChartWidgetHandler = (
  payload: typeof GeoChartWidgetPayload.Type,
) => Effect.succeed(payload);
