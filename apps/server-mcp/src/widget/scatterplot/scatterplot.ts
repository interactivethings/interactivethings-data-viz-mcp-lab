import { ScatterplotWidgetPayload } from "@repo/domain/Chart";
import { Effect } from "effect";
import {
  makeUiRenderTool,
  makeUiResource,
  readPublicAsset,
} from "../../UiResource";

const ScatterplotWidgetResourceUri = "ui://scatterplot";

const ScatterplotWidgetHtml = readPublicAsset({
  importMetaDir: import.meta.dir,
  sourceSuffix: "src/widget/scatterplot",
  sourcePath: "../../../public/widgets/widget-scatterplot.html",
  distPath: "public/widgets/widget-scatterplot.html",
});

export const ScatterplotWidgetResourceLayer = makeUiResource(
  ScatterplotWidgetResourceUri,
  {
    name: "Scatterplot",
    description: "Scatterplot widget UI",
    html: ScatterplotWidgetHtml,
    meta: {
      prefersBorder: false,
    },
  },
);

export const RenderScatterplotWidgetTool = makeUiRenderTool(
  ScatterplotWidgetResourceUri,
  {
    name: "render_scatterplot_widget",
    title: "Scatterplot",
    description: "Render the scatterplot widget UI",
    parameters: ScatterplotWidgetPayload,
    success: ScatterplotWidgetPayload,
  },
);

export const renderScatterplotWidgetHandler = (
  payload: typeof ScatterplotWidgetPayload.Type,
) => Effect.succeed(payload);
