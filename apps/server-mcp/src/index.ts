import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { ObservabilityLive } from "@repo/observability";
import { Config, Effect, Layer } from "effect";
import { McpServer, Toolkit } from "effect/unstable/ai";
import { DevTools } from "effect/unstable/devtools";
import { HttpRouter, HttpServer } from "effect/unstable/http";
import { barChartOneShot } from "./prompt/bar-chart-one-shot";
import {
  BarChartWidgetResourceLayer,
  RenderBarChartWidgetTool,
  renderBarChartWidgetHandler,
} from "./widget/bar-chart/bar-chart";
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

// Define Resources
const ResourceLayer = Layer.mergeAll(
  BarChartWidgetResourceLayer,
  LineChartWidgetResourceLayer,
  ScatterplotWidgetResourceLayer,
  // You can add more resources here
);

// Define Prompts
const PromptLayer = Layer.mergeAll(
  barChartOneShot,
  // You can add more prompts here
);

// Define Toolkit
class AiTools extends Toolkit.make(
  RenderBarChartWidgetTool,
  RenderLineChartWidgetTool,
  RenderScatterplotWidgetTool,
  // You can add more tools here
) {}

const ToolLayer = McpServer.toolkit(AiTools).pipe(
  Layer.provide(
    AiTools.toLayer({
      render_bar_chart_widget: renderBarChartWidgetHandler,
      render_line_chart_widget: renderLineChartWidgetHandler,
      render_scatterplot_widget: renderScatterplotWidgetHandler,
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
