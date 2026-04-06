import { HeatmapWidgetPayload } from "@repo/domain/Chart";
import { Effect } from "effect";
import {
  makeUiRenderTool,
  makeUiResource,
  readPublicAsset,
} from "../../UiResource";

const HeatmapWidgetResourceUri = "ui://heatmap";

const HeatmapWidgetHtml = readPublicAsset({
  importMetaDir: import.meta.dir,
  sourceSuffix: "src/widget/heatmap",
  sourcePath: "../../../public/widgets/widget-heatmap.html",
  distPath: "public/widgets/widget-heatmap.html",
});

export const HeatmapWidgetResourceLayer = makeUiResource(
  HeatmapWidgetResourceUri,
  {
    name: "Heatmap",
    description: "Heatmap widget UI",
    html: HeatmapWidgetHtml,
    meta: {
      prefersBorder: false,
    },
  },
);

export const RenderHeatmapWidgetTool = makeUiRenderTool(
  HeatmapWidgetResourceUri,
  {
    name: "render_heatmap_widget",
    title: "Heatmap",
    description: "Render the heatmap widget UI",
    parameters: HeatmapWidgetPayload,
    success: HeatmapWidgetPayload,
  },
);

export const renderHeatmapWidgetHandler = (
  payload: typeof HeatmapWidgetPayload.Type,
) => Effect.succeed(payload);
