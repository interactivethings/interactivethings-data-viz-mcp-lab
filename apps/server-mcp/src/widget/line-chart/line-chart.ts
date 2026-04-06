import { LineChartWidgetPayload } from "@repo/domain/Chart";
import { Effect } from "effect";
import {
  makeUiRenderTool,
  makeUiResource,
  readPublicAsset,
} from "../../UiResource";

const LineChartWidgetResourceUri = "ui://line-chart";

const LineChartWidgetHtml = readPublicAsset({
  importMetaDir: import.meta.dir,
  sourceSuffix: "src/widget/line-chart",
  sourcePath: "../../../public/widgets/widget-line-chart.html",
  distPath: "public/widgets/widget-line-chart.html",
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
