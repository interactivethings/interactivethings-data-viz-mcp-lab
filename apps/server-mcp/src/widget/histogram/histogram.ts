import { HistogramWidgetPayload } from "@repo/domain/Chart";
import { Effect } from "effect";
import {
  makeUiRenderTool,
  makeUiResource,
  readPublicAsset,
} from "../../UiResource";

const HistogramWidgetResourceUri = "ui://histogram";

const HistogramWidgetHtml = readPublicAsset({
  importMetaDir: import.meta.dir,
  sourceSuffix: "src/widget/histogram",
  sourcePath: "../../../public/widgets/widget-histogram.html",
  distPath: "public/widgets/widget-histogram.html",
});

export const HistogramWidgetResourceLayer = makeUiResource(
  HistogramWidgetResourceUri,
  {
    name: "Histogram",
    description: "Histogram widget UI",
    html: HistogramWidgetHtml,
    meta: {
      prefersBorder: false,
    },
  },
);

export const RenderHistogramWidgetTool = makeUiRenderTool(
  HistogramWidgetResourceUri,
  {
    name: "render_histogram_widget",
    title: "Histogram",
    description: "Render the histogram widget UI",
    parameters: HistogramWidgetPayload,
    success: HistogramWidgetPayload,
  },
);

export const renderHistogramWidgetHandler = (
  payload: typeof HistogramWidgetPayload.Type,
) => Effect.succeed(payload);
