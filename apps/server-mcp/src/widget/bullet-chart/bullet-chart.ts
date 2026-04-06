import { BulletChartWidgetPayload } from "@repo/domain/Chart";
import { Effect } from "effect";
import {
  makeUiRenderTool,
  makeUiResource,
  readPublicAsset,
} from "../../UiResource";

const BulletChartWidgetResourceUri = "ui://bullet-chart";

const BulletChartWidgetHtml = readPublicAsset({
  importMetaDir: import.meta.dir,
  sourceSuffix: "src/widget/bullet-chart",
  sourcePath: "../../../public/widgets/widget-bullet-chart.html",
  distPath: "public/widgets/widget-bullet-chart.html",
});

export const BulletChartWidgetResourceLayer = makeUiResource(
  BulletChartWidgetResourceUri,
  {
    name: "Bullet Chart",
    description: "Bullet chart widget UI",
    html: BulletChartWidgetHtml,
    meta: {
      prefersBorder: false,
    },
  },
);

export const RenderBulletChartWidgetTool = makeUiRenderTool(
  BulletChartWidgetResourceUri,
  {
    name: "render_bullet_chart_widget",
    title: "Bullet Chart",
    description: "Render the bullet chart widget UI",
    parameters: BulletChartWidgetPayload,
    success: BulletChartWidgetPayload,
  },
);

export const renderBulletChartWidgetHandler = (
  payload: typeof BulletChartWidgetPayload.Type,
) => Effect.succeed(payload);
