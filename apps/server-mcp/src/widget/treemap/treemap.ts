import { TreemapWidgetPayload } from "@repo/domain/Chart";
import { Effect } from "effect";
import {
  makeUiRenderTool,
  makeUiResource,
  readPublicAsset,
} from "../../UiResource";

const TreemapWidgetResourceUri = "ui://treemap";

const TreemapWidgetHtml = readPublicAsset({
  importMetaDir: import.meta.dir,
  sourceSuffix: "src/widget/treemap",
  sourcePath: "../../../public/widgets/widget-treemap.html",
  distPath: "public/widgets/widget-treemap.html",
});

export const TreemapWidgetResourceLayer = makeUiResource(
  TreemapWidgetResourceUri,
  {
    name: "Treemap",
    description: "Treemap widget UI",
    html: TreemapWidgetHtml,
    meta: {
      prefersBorder: false,
    },
  },
);

export const RenderTreemapWidgetTool = makeUiRenderTool(
  TreemapWidgetResourceUri,
  {
    name: "render_treemap_widget",
    title: "Treemap",
    description: "Render the treemap widget UI",
    parameters: TreemapWidgetPayload,
    success: TreemapWidgetPayload,
  },
);

export const renderTreemapWidgetHandler = (
  payload: typeof TreemapWidgetPayload.Type,
) => Effect.succeed(payload);
