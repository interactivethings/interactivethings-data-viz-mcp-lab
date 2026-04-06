import { AreaChartWidgetPayload } from "@repo/domain/Chart";
import { Effect } from "effect";
import {
  makeUiRenderTool,
  makeUiResource,
  readPublicAsset,
} from "../../UiResource";

const AreaChartWidgetResourceUri = "ui://area-chart";

const AreaChartWidgetHtml = readPublicAsset({
  importMetaDir: import.meta.dir,
  sourceSuffix: "src/widget/area-chart",
  sourcePath: "../../../public/widgets/widget-area-chart.html",
  distPath: "public/widgets/widget-area-chart.html",
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
