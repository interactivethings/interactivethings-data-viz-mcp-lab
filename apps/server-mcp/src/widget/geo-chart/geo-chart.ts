import { GeoChartWidgetPayload } from "@repo/domain/Chart";
import { Effect } from "effect";
import {
  makeUiRenderTool,
  makeUiResource,
  readPublicAsset,
} from "../../UiResource";

const GeoChartWidgetResourceUri = "ui://geo-chart";

const GeoChartWidgetHtml = readPublicAsset({
  importMetaDir: import.meta.dir,
  sourceSuffix: "src/widget/geo-chart",
  sourcePath: "../../../public/widgets/widget-geo-chart.html",
  distPath: "public/widgets/widget-geo-chart.html",
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
