import { BulletChartWidgetPayload } from "@repo/domain/Chart";
import { Effect, FileSystem, Path } from "effect";
import { makeUiRenderTool, makeUiResource } from "../../UiResource";

const BulletChartWidgetResourceUri = "ui://bullet-chart";

const BulletChartWidgetHtml = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const sourceSuffix = path.join("widget", "bullet-chart");
  const isSourcePath = import.meta.dir.endsWith(sourceSuffix);
  const htmlPath = isSourcePath
    ? path.join(import.meta.dir, "widget-bullet-chart.html")
    : path.join(
        import.meta.dir,
        "widget/bullet-chart/widget-bullet-chart.html",
      );
  return yield* fs.readFileString(htmlPath);
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
