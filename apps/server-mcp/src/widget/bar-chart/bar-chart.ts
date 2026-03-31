import { join as joinPath } from "node:path";
import { Effect, FileSystem, Schema } from "effect";
import { makeUiRenderTool, makeUiResource } from "../../UiResource";

const BarChartWidgetResourceUri = "ui://bar-chart";

const BarChartWidgetHtml = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const sourceSuffix = joinPath("widget", "bar-chart");
  const isSourcePath = import.meta.dir.endsWith(sourceSuffix);
  const htmlPath = isSourcePath
    ? joinPath(import.meta.dir, "bar-chart-widget.html")
    : joinPath(import.meta.dir, "widget/bar-chart/bar-chart-widget.html");
  return yield* fs.readFileString(htmlPath);
});

export const BarChartWidgetResourceLayer = makeUiResource(
  BarChartWidgetResourceUri,
  {
    name: "Bar Chart",
    description: "Bar chart widget UI",
    html: BarChartWidgetHtml,
    meta: {
      prefersBorder: false,
    },
    withAppsSdk: true,
  },
);

const BarChartNumber = Schema.Union([Schema.Number, Schema.NumberFromString]);

const BarChartDatum = Schema.Struct({
  category: Schema.String,
  value: BarChartNumber,
});

const BarChartWidgetProps = Schema.Struct({
  title: Schema.optional(Schema.String),
  valueLabel: Schema.optional(Schema.String),
  maxWidth: Schema.optional(BarChartNumber),
  width: Schema.optional(BarChartNumber),
  height: Schema.optional(BarChartNumber),
  showLabels: Schema.optional(Schema.Boolean),
  maxY: Schema.optional(BarChartNumber),
});

export const BarChartWidgetPayload = Schema.Struct({
  data: Schema.optional(Schema.Array(BarChartDatum)),
  dataUrl: Schema.optional(Schema.String),
  props: Schema.optional(BarChartWidgetProps),
});

export const RenderBarChartWidgetTool = makeUiRenderTool(
  BarChartWidgetResourceUri,
  {
    name: "render_bar_chart_widget",
    title: "Bar Chart",
    description: "Render the bar chart widget UI",
    parameters: BarChartWidgetPayload,
    success: BarChartWidgetPayload,
    openai: {
      toolInvocation: {
        invoking: "Loading bar chart widget...",
        invoked: "Bar chart widget ready",
      },
    },
  },
);

export const renderBarChartWidgetHandler = (
  payload: typeof BarChartWidgetPayload.Type,
) => Effect.succeed(payload);
