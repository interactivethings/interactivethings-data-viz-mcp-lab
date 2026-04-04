import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { ClientCapabilities } from "@modelcontextprotocol/sdk/types";
import { Config, Data, Effect, Layer, ServiceMap } from "effect";
import type { JsonObject } from "effect/Schema";
import type { McpSchema } from "effect/unstable/ai";

const DEFAULT_CLIENT_INFO: McpSchema.Implementation = {
  name: "edu-effect-dynamic-tool-server",
  version: "0.0.1",
};

export type McpClientOptions = {
  readonly url: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly clientInfo?: McpSchema.Implementation;
  readonly capabilities?: ClientCapabilities;
};

export type McpClientSession = {
  readonly url: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly sessionId?: string;
  readonly clientInfo: McpSchema.Implementation;
  readonly serverInfo?: McpSchema.Implementation;
  readonly serverCapabilities?: JsonObject;
  readonly capabilities: ClientCapabilities;
  readonly instructions?: string;
};

export class McpClientInitializationError extends Data.TaggedError(
  "McpClientInitializationError",
)<{
  readonly cause?: unknown;
}> {}

export class McpClientError extends Data.TaggedError("McpClientError")<{
  readonly message?: string;
  readonly cause?: unknown;
}> {}

export type McpToolCallParams = {
  readonly name: string;
  readonly arguments?: Readonly<Record<string, unknown>>;
};

export type McpResource = {
  readonly uri: string;
  readonly name: string;
  readonly description?: string;
  readonly mimeType?: string;
};

export type UiResourceMeta = {
  readonly csp?: {
    resourceDomains?: string[];
    connectDomains?: string[];
    frameDomains?: string[];
    baseUriDomains?: string[];
  };
  readonly permissions?: string[];
  readonly prefersBorder?: boolean;
  readonly domain?: string;
};

export type UiResource = {
  readonly uri: string;
  readonly html: string;
  readonly meta?: UiResourceMeta;
};

const UiResourceMimeType = "text/html;profile=mcp-app";

const McpClientConfig = Config.all({
  url: Config.string("MCP_SERVER_URL").pipe(
    Config.withDefault("http://localhost:9009/mcp"),
  ),
});

const UiExtensionCapabilities = {
  "io.modelcontextprotocol/ui": {
    mimeTypes: [UiResourceMimeType],
  },
} as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export class McpClient extends ServiceMap.Service<McpClient>()("McpClient", {
  make: (options: McpClientOptions) =>
    Effect.gen(function* () {
      const client = yield* Effect.try({
        try: () =>
          new Client(
            {
              name: options.clientInfo?.name ?? DEFAULT_CLIENT_INFO.name,
              version:
                options.clientInfo?.version ?? DEFAULT_CLIENT_INFO.version,
            },
            options.capabilities
              ? { capabilities: options.capabilities }
              : undefined,
          ),
        catch: (cause) => new McpClientInitializationError({ cause }),
      });

      const use = <A>(fn: (client: Client) => Promise<A>) =>
        Effect.tryPromise({
          try: () => fn(client),
          catch: (cause) => new McpClientError({ cause }),
        }).pipe(Effect.withSpan(`McpClient.${fn.name ?? "use"}`));

      const transport = new StreamableHTTPClientTransport(
        new URL(options.url),
        options.headers
          ? { requestInit: { headers: options.headers } }
          : undefined,
      );

      yield* Effect.acquireRelease(
        Effect.tryPromise({
          try: (signal) => client.connect(transport as Transport, { signal }),
          catch: (cause) =>
            new McpClientError({
              message: "Failed to connect MCP SDK client",
              cause,
            }),
        }),
        () => Effect.promise(() => client.close()),
      );

      const serverInfo = client.getServerVersion();
      const serverCapabilities = client.getServerCapabilities();
      const instructions = client.getInstructions();

      const session: McpClientSession = {
        url: options.url,
        ...(options.headers ? { headers: options.headers } : {}),
        clientInfo: options.clientInfo ?? DEFAULT_CLIENT_INFO,
        capabilities: options.capabilities ?? {},
        ...(serverInfo ? { serverInfo } : {}),
        ...(serverCapabilities
          ? { serverCapabilities: serverCapabilities as JsonObject }
          : {}),
        ...(instructions ? { instructions } : {}),
      };

      const listTools = () =>
        use(async (c) => {
          const tools: Array<typeof McpSchema.Tool.Type> = [];
          let cursor: string | undefined;

          do {
            const page = await c.listTools({ cursor });
            tools.push(...(page.tools as Array<typeof McpSchema.Tool.Type>));
            cursor = page.nextCursor ?? undefined;
          } while (cursor);

          return tools;
        });

      const listResources = () =>
        use(async (c) => {
          const resources: Array<McpResource> = [];
          let cursor: string | undefined;

          do {
            const page = await c.listResources({ cursor });
            resources.push(...(page.resources as Array<McpResource>));
            cursor = page.nextCursor ?? undefined;
          } while (cursor);

          return resources;
        });

      const uiResourceCache = new Map<string, UiResource>();

      const extractUiResource = (
        uri: string,
        response: unknown,
      ): UiResource => {
        if (!isRecord(response)) {
          throw new McpClientError({
            message: `Invalid MCP resource response for ${uri}`,
          });
        }
        const contents = response["contents"];
        if (!Array.isArray(contents)) {
          throw new McpClientError({
            message: `Missing MCP resource contents for ${uri}`,
          });
        }
        const match = contents.find(
          (item) =>
            isRecord(item) &&
            typeof item["text"] === "string" &&
            item["mimeType"] === UiResourceMimeType,
        ) as Record<string, unknown> | undefined;

        if (!match || typeof match["text"] !== "string") {
          throw new McpClientError({
            message: `UI resource ${uri} is missing HTML content`,
          });
        }

        const meta = isRecord(match["_meta"])
          ? ((match["_meta"] as Record<string, unknown>)["ui"] as
              | UiResourceMeta
              | undefined)
          : undefined;

        return {
          uri: typeof match["uri"] === "string" ? match["uri"] : uri,
          html: match["text"],
          ...(meta ? { meta } : {}),
        };
      };

      const getUiResource = (uri: string) =>
        Effect.gen(function* () {
          const cached = uiResourceCache.get(uri);
          if (cached) return cached;
          const response = yield* use((c) => c.readResource({ uri }));
          const resource = extractUiResource(uri, response);
          uiResourceCache.set(uri, resource);
          return resource;
        });

      return {
        use,
        getSession: () => Effect.succeed(session),
        listTools,
        listResources,
        callTool: (params: McpToolCallParams) => use((c) => c.callTool(params)),
        readResource: (uri: string) => use((c) => c.readResource({ uri })),
        getUiResource,
      };
    }),
}) {}

export const McpClientServiceLive = Effect.gen(function* () {
  const config = yield* McpClientConfig;
  return yield* McpClient.make({
    url: config.url,
    capabilities: { extensions: UiExtensionCapabilities },
  });
}).pipe(Layer.effect(McpClient));
