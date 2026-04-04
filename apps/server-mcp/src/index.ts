import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { ObservabilityLive } from "@repo/observability";
import { Config, Effect, Layer } from "effect";
import { McpServer, Toolkit } from "effect/unstable/ai";
import { DevTools } from "effect/unstable/devtools";
import { HttpRouter, HttpServer } from "effect/unstable/http";
import { barChartOneShot } from "./prompt/bar-chart-one-shot";
import { DataVisualizationResourceLayer } from "./resource/data-visualization";
import {
  AreaChartWidgetResourceLayer,
  RenderAreaChartWidgetTool,
  renderAreaChartWidgetHandler,
} from "./widget/area-chart/area-chart";
import {
  BarChartWidgetResourceLayer,
  RenderBarChartWidgetTool,
  renderBarChartWidgetHandler,
} from "./widget/bar-chart/bar-chart";
import {
  BoxPlotWidgetResourceLayer,
  RenderBoxPlotWidgetTool,
  renderBoxPlotWidgetHandler,
} from "./widget/box-plot/box-plot";
import {
  BulletChartWidgetResourceLayer,
  RenderBulletChartWidgetTool,
  renderBulletChartWidgetHandler,
} from "./widget/bullet-chart/bullet-chart";

import {
  GeoChartWidgetResourceLayer,
  RenderGeoChartWidgetTool,
  renderGeoChartWidgetHandler,
} from "./widget/geo-chart/geo-chart";
import {
  HeatmapWidgetResourceLayer,
  RenderHeatmapWidgetTool,
  renderHeatmapWidgetHandler,
} from "./widget/heatmap/heatmap";
import {
  HistogramWidgetResourceLayer,
  RenderHistogramWidgetTool,
  renderHistogramWidgetHandler,
} from "./widget/histogram/histogram";
import {
  LineChartWidgetResourceLayer,
  RenderLineChartWidgetTool,
  renderLineChartWidgetHandler,
} from "./widget/line-chart/line-chart";
import {
  RenderScatterplotWidgetTool,
  renderScatterplotWidgetHandler,
  ScatterplotWidgetResourceLayer,
} from "./widget/scatterplot/scatterplot";
import {
  RenderTreemapWidgetTool,
  renderTreemapWidgetHandler,
  TreemapWidgetResourceLayer,
} from "./widget/treemap/treemap";

// Define Resources
const ResourceLayer = Layer.mergeAll(
  AreaChartWidgetResourceLayer,
  BarChartWidgetResourceLayer,
  BoxPlotWidgetResourceLayer,
  BulletChartWidgetResourceLayer,
  GeoChartWidgetResourceLayer,
  HeatmapWidgetResourceLayer,
  HistogramWidgetResourceLayer,
  LineChartWidgetResourceLayer,
  ScatterplotWidgetResourceLayer,
  TreemapWidgetResourceLayer,
  DataVisualizationResourceLayer,
  // You can add more resources here
);

// Define Prompts
const PromptLayer = Layer.mergeAll(
  barChartOneShot,
  // You can add more prompts here
);

// Define Toolkit
class AiTools extends Toolkit.make(
  RenderAreaChartWidgetTool,
  RenderBarChartWidgetTool,
  RenderBoxPlotWidgetTool,
  RenderBulletChartWidgetTool,
  RenderGeoChartWidgetTool,
  RenderHeatmapWidgetTool,
  RenderHistogramWidgetTool,
  RenderLineChartWidgetTool,
  RenderScatterplotWidgetTool,
  RenderTreemapWidgetTool,
  // You can add more tools here
) {}

const ToolLayer = McpServer.toolkit(AiTools).pipe(
  Layer.provide(
    AiTools.toLayer({
      render_area_chart_widget: renderAreaChartWidgetHandler,
      render_bar_chart_widget: renderBarChartWidgetHandler,
      render_box_plot_widget: renderBoxPlotWidgetHandler,
      render_bullet_chart_widget: renderBulletChartWidgetHandler,
      render_geo_chart_widget: renderGeoChartWidgetHandler,
      render_heatmap_widget: renderHeatmapWidgetHandler,
      render_histogram_widget: renderHistogramWidgetHandler,
      render_line_chart_widget: renderLineChartWidgetHandler,
      render_scatterplot_widget: renderScatterplotWidgetHandler,
      render_treemap_widget: renderTreemapWidgetHandler,
      // add implementation for more tools here
    }),
  ),
);

// Define Live API
const McpLive = Layer.mergeAll(ResourceLayer, PromptLayer, ToolLayer);

const ServerConfig = Config.all({
  port: Config.number("PORT").pipe(Config.withDefault(9009)),
  enableDevTools: Config.boolean("DEVTOOLS").pipe(Config.withDefault(false)),
});

const McpRouter = McpServer.layerHttp({
  name: "IxT Data Viz MCP Server",
  version: "0.1.0",
  path: "/mcp",
  extensions: {
    "io.modelcontextprotocol/ui": {
      mimeTypes: ["text/html;profile=mcp-app"],
    },
  },
}).pipe(
  Layer.provideMerge(McpLive),
  Layer.provide(
    HttpRouter.cors({
      allowedOrigins: ["*"],
      allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "mcp-protocol-version",
        "mcp-session-id",
      ],
      exposedHeaders: ["mcp-session-id", "mcp-protocol-version"],
      credentials: false,
    }),
  ),
);

const DevToolsLive = Effect.gen(function* () {
  const config = yield* ServerConfig;
  if (!config.enableDevTools) {
    return Layer.empty;
  }
  yield* Effect.log("Enabling DevTools Layer");
  return DevTools.layer();
}).pipe(Layer.unwrap);

const HttpLive = HttpRouter.serve(McpRouter).pipe(
  HttpServer.withLogAddress,
  Layer.provideMerge(DevToolsLive),
  Layer.provideMerge(ObservabilityLive),
  Layer.provideMerge(BunHttpServer.layerConfig(ServerConfig)),
);

BunRuntime.runMain(Layer.launch(HttpLive));
