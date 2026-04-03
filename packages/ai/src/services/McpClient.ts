import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { Config, Data, Effect, Layer, ServiceMap } from "effect";
import type { JsonObject } from "effect/Schema";
import type { McpSchema } from "effect/unstable/ai";

const DEFAULT_PROTOCOL_VERSION = "2024-11-05";
const DEFAULT_CLIENT_INFO: McpSchema.Implementation = {
  name: "edu-effect-dynamic-tool-server",
  version: "0.0.1",
};

export type McpClientOptions = {
  readonly url: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly protocolVersion?: string;
  readonly clientInfo?: McpSchema.Implementation;
  readonly capabilities?: JsonObject;
};

export type McpClientSession = {
  readonly url: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly sessionId?: string;
  readonly protocolVersion: string;
  readonly clientInfo: McpSchema.Implementation;
  readonly serverInfo?: McpSchema.Implementation;
  readonly serverCapabilities?: JsonObject;
  readonly capabilities: JsonObject;
  readonly instructions?: string;
};

export class McpClientError extends Data.TaggedError("McpClientError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type McpToolCallParams = {
  readonly name: string;
  readonly arguments?: Readonly<Record<string, unknown>>;
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

type McpInitializeResult = {
  readonly protocolVersion?: string;
  readonly serverInfo?: McpSchema.Implementation;
  readonly capabilities?: JsonObject;
  readonly instructions?: string;
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
      const client = new Client({
        name: options.clientInfo?.name ?? DEFAULT_CLIENT_INFO.name,
        version: options.clientInfo?.version ?? DEFAULT_CLIENT_INFO.version,
      });

      const transport = new StreamableHTTPClientTransport(
        new (
          globalThis as typeof globalThis & {
            URL: new (url: string) => unknown;
          }
        ).URL(options.url) as unknown,
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

      let session: McpClientSession = {
        url: options.url,
        ...(options.headers ? { headers: options.headers } : {}),
        protocolVersion: options.protocolVersion ?? DEFAULT_PROTOCOL_VERSION,
        clientInfo: options.clientInfo ?? DEFAULT_CLIENT_INFO,
        capabilities: options.capabilities ?? {},
      };

      const initialize = () =>
        Effect.tryPromise({
          try: async () => {
            const initializer = client as unknown as {
              initialize?: (params: {
                protocolVersion: string;
                clientInfo: McpSchema.Implementation;
                capabilities: JsonObject;
              }) => Promise<McpInitializeResult>;
            };
            if (typeof initializer.initialize !== "function") {
              return undefined;
            }
            return await initializer.initialize({
              protocolVersion: session.protocolVersion,
              clientInfo: session.clientInfo,
              capabilities: session.capabilities,
            });
          },
          catch: (cause) =>
            new McpClientError({
              message: "Failed to initialize MCP client session",
              cause,
            }),
        });

      const initializeResult = yield* initialize();
      if (initializeResult) {
        session = {
          ...session,
          protocolVersion:
            initializeResult.protocolVersion ?? session.protocolVersion,
          ...(initializeResult.serverInfo
            ? { serverInfo: initializeResult.serverInfo }
            : {}),
          ...(initializeResult.capabilities
            ? { serverCapabilities: initializeResult.capabilities }
            : {}),
          ...(initializeResult.instructions
            ? { instructions: initializeResult.instructions }
            : {}),
        };
      }

      const getSession = () => Effect.succeed(session);

      const listAllTools = () =>
        Effect.tryPromise({
          try: async () => {
            const tools: Array<typeof McpSchema.Tool.Type> = [];
            let cursor: string | undefined;

            do {
              const page = await client.listTools({ cursor });
              tools.push(...(page.tools as Array<typeof McpSchema.Tool.Type>));
              cursor = page.nextCursor ?? undefined;
            } while (cursor);

            return tools;
          },
          catch: (cause) =>
            new McpClientError({
              message: "Failed to list MCP tools",
              cause,
            }),
        });

      const toolCall = (params: McpToolCallParams) =>
        Effect.tryPromise({
          try: async () =>
            await client.callTool({
              name: params.name,
              arguments: params.arguments,
            }),
          catch: (cause) =>
            new McpClientError({
              message: "Failed to call MCP tool",
              cause,
            }),
        });

      const readResource = (uri: string) =>
        Effect.tryPromise({
          try: async () => await client.readResource({ uri }),
          catch: (cause) =>
            new McpClientError({
              message: `Failed to read MCP resource ${uri}`,
              cause,
            }),
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
          const response = yield* readResource(uri);
          const resource = extractUiResource(uri, response);
          uiResourceCache.set(uri, resource);
          return resource;
        });

      const getTools = () => listAllTools();

      const callTool = (params: McpToolCallParams) => toolCall(params);

      return {
        getSession,
        listAllTools,
        getTools,
        toolCall,
        callTool,
        readResource,
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
