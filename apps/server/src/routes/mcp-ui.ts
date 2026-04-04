import { McpClient } from "@repo/ai";
import { Effect, Schema } from "effect";
import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse,
} from "effect/unstable/http";
import { buildCspHeader } from "../lib/mcp-ui";

const ReadResourceBody = Schema.Struct({
  uri: Schema.String,
});

const CallToolBody = Schema.Struct({
  name: Schema.String,
  arguments: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
});

const PathParams = Schema.Struct({
  uri: Schema.String,
});

const isVisibleToModel = (visibility?: Array<"model" | "app">) => {
  if (!visibility || visibility.length === 0) return true;
  return visibility.includes("model");
};

export const McpUiRoutes = HttpRouter.use(
  Effect.fn(function* (router: HttpRouter.HttpRouter) {
    yield* router.add("GET", "/mcp-ui/tools", () =>
      Effect.gen(function* () {
        const client = yield* McpClient;
        const tools = yield* client.listTools();

        const filtered = tools.filter((tool) => {
          const meta = tool._meta as
            | { ui?: { visibility?: Array<"model" | "app"> } }
            | undefined;
          return isVisibleToModel(meta?.ui?.visibility);
        });

        return yield* HttpServerResponse.json({ tools: filtered });
      }),
    );

    yield* router.add("GET", "/mcp-ui/resources/:uri", () =>
      Effect.gen(function* () {
        const client = yield* McpClient;
        const { uri } = yield* HttpRouter.schemaPathParams(PathParams);
        const decodedUri = decodeURIComponent(uri);
        const resource = yield* client.getUiResource(decodedUri);
        const cspHeader = buildCspHeader(resource.meta?.csp);

        yield* Effect.log(`MCP UI resource ${decodedUri} CSP: ${cspHeader}`);

        return yield* HttpServerResponse.json(
          {
            uri: resource.uri,
            html: resource.html,
            meta: resource.meta ?? null,
          },
          {
            headers: {
              "content-security-policy": cspHeader,
            },
          },
        );
      }),
    );

    yield* router.add("POST", "/mcp-ui/resources/read", () =>
      Effect.gen(function* () {
        const client = yield* McpClient;
        const { uri } =
          yield* HttpServerRequest.schemaBodyJson(ReadResourceBody);
        const resource = yield* client.readResource(uri);
        return yield* HttpServerResponse.json(resource);
      }),
    );

    yield* router.add("POST", "/mcp-ui/tools/call", () =>
      Effect.gen(function* () {
        const client = yield* McpClient;
        const body = yield* HttpServerRequest.schemaBodyJson(CallToolBody);

        yield* Effect.log(`MCP UI tool call ${body.name} via UI proxy`);

        const result = yield* client.callTool(
          body.arguments
            ? { name: body.name, arguments: body.arguments }
            : { name: body.name },
        );

        return yield* HttpServerResponse.json(result);
      }),
    );
  }),
);
