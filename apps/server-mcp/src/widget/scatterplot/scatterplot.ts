import { ScatterplotWidgetPayload } from "@repo/domain/Chart";
import { Effect, FileSystem, Path } from "effect";
import { makeUiRenderTool, makeUiResource } from "../../UiResource";

const ScatterplotWidgetResourceUri = "ui://scatterplot";

const ScatterplotWidgetHtml = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const sourceSuffix = path.join("widget", "scatterplot");
  const isSourcePath = import.meta.dir.endsWith(sourceSuffix);
  const htmlPath = isSourcePath
    ? path.join(import.meta.dir, "widget-scatterplot.html")
    : path.join(import.meta.dir, "widget/scatterplot/widget-scatterplot.html");
  return yield* fs.readFileString(htmlPath);
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
