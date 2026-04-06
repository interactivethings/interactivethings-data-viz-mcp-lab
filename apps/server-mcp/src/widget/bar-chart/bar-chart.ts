import { BarChartWidgetPayload } from "@repo/domain/Chart";
import { Effect } from "effect";
import {
  makeUiRenderTool,
  makeUiResource,
  readPublicAsset,
} from "../../UiResource";

const BarChartWidgetResourceUri = "ui://bar-chart";

const BarChartWidgetHtml = readPublicAsset({
  importMetaDir: import.meta.dir,
  sourceSuffix: "src/widget/bar-chart",
  sourcePath: "../../../public/widgets/widget-bar-chart.html",
  distPath: "public/widgets/widget-bar-chart.html",
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
