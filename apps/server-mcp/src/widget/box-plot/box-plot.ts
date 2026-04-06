import { BoxPlotWidgetPayload } from "@repo/domain/Chart";
import { Effect } from "effect";
import {
  makeUiRenderTool,
  makeUiResource,
  readPublicAsset,
} from "../../UiResource";

const BoxPlotWidgetResourceUri = "ui://box-plot";

const BoxPlotWidgetHtml = readPublicAsset({
  importMetaDir: import.meta.dir,
  sourceSuffix: "src/widget/box-plot",
  sourcePath: "../../../public/widgets/widget-box-plot.html",
  distPath: "public/widgets/widget-box-plot.html",
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
