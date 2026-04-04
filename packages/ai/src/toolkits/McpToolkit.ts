import { Effect, Layer, Schema } from "effect";
import type { McpSchema } from "effect/unstable/ai";
import { AiError, Tool, Toolkit } from "effect/unstable/ai";
import { McpClient } from "../services/McpClient";

type McpToolkitOptions = {
  readonly namePrefix?: string;
};

const ResourceSummary = Schema.Struct({
  uri: Schema.String,
  name: Schema.String,
  description: Schema.optional(Schema.String),
  mimeType: Schema.optional(Schema.String),
});

const ResourceContent = Schema.Struct({
  uri: Schema.String,
  mimeType: Schema.optional(Schema.String),
  text: Schema.optional(Schema.String),
  _meta: Schema.optional(Schema.Unknown),
});

export const ListResourcesTool = Tool.make("list_resources", {
  description: "List MCP resources available on this server",
  parameters: Tool.EmptyParams,
  success: Schema.Struct({
    resources: Schema.Array(ResourceSummary),
  }),
  failure: Schema.Never,
  needsApproval: false,
  dependencies: [McpClient],
});

export const ReadResourceTool = Tool.make("read_resource", {
  description:
    "Read an MCP resource by uri. Use this to pull guidance (e.g., app://data-visualization) before rendering widgets.",
  parameters: Schema.Struct({
    uri: Schema.String,
  }),
  success: Schema.Struct({
    contents: Schema.Array(ResourceContent),
  }),
  failure: Schema.Never,
  needsApproval: false,
  dependencies: [McpClient],
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isVisibleToModel = (tool: typeof McpSchema.Tool.Type) => {
  const meta = tool._meta as
    | { ui?: { visibility?: Array<"model" | "app"> } }
    | undefined;
  const visibility = meta?.ui?.visibility;
  if (!visibility || visibility.length === 0) return true;
  return visibility.includes("model");
};

export const createMcpToolkit = (options: McpToolkitOptions) =>
  Effect.gen(function* () {
    const client = yield* McpClient;
    const session = yield* client.getSession();
    const tools = (yield* client.listTools()).filter(isVisibleToModel);

    yield* Effect.log(
      `MCP toolkit loaded ${tools.length} tool(s): ${tools
        .map((tool) => tool.name)
        .join(", ")}`,
    );

    if (tools.length === 0) {
      return {
        toolkit: Toolkit.empty,
        layer: Layer.empty,
        session,
        tools,
      } as const;
    }

    const dynamicTools = tools.map((tool) =>
      Tool.dynamic(`${options.namePrefix ?? ""}${tool.name}`, {
        description: tool.description,
        parameters: Schema.Struct({
          payload: Schema.String,
        }),
        success: Schema.Unknown,
        failure: Schema.String,
        failureMode: "return",
      }),
    );

    const toolkit = Toolkit.make(
      ...dynamicTools,
      ListResourcesTool,
      ReadResourceTool,
    );

    const dynamicHandlers = Object.fromEntries(
      tools.map((tool) => [
        `${options.namePrefix ?? ""}${tool.name}`,
        (input: unknown) =>
          Effect.gen(function* () {
            yield* Effect.log(
              `MCP tool call ${tool.name} raw input: ${globalThis.String(
                JSON.stringify(input),
              )}`,
            );
            if (!isRecord(input) || typeof input["payload"] !== "string") {
              return yield* Effect.fail(
                `MCP tool "${tool.name}" expected a JSON payload string.`,
              );
            }

            const toolArgs = yield* Effect.try({
              try: () => JSON.parse(input["payload"] as string),
              catch: (error) =>
                new Error(
                  `MCP tool "${tool.name}" payload must be valid JSON: ${
                    error instanceof Error ? error.message : String(error)
                  }`,
                ),
            });

            yield* Effect.log(
              `MCP tool call ${tool.name} parsed args: ${globalThis.String(
                JSON.stringify(toolArgs),
              )}`,
            );

            if (!isRecord(toolArgs)) {
              return yield* Effect.fail(
                `MCP tool "${tool.name}" expected object payload JSON.`,
              );
            }

            const result = yield* client.callTool({
              name: tool.name,
              arguments: toolArgs,
            });

            yield* Effect.log(
              `MCP tool call ${tool.name} result: ${globalThis.String(
                JSON.stringify(result),
              )}`,
            );

            if (result.isError) {
              return yield* Effect.fail(
                `MCP tool "${tool.name}" failed: ${globalThis.String(result.content)}`,
              );
            }

            return result.structuredContent || result.content;
          }).pipe(
            Effect.catch((error) =>
              Effect.fail(
                typeof error === "string"
                  ? error
                  : `MCP tool "${tool.name}" failed`,
              ),
            ),
          ),
      ]),
    );

    const resourceHandlers = {
      list_resources: () =>
        Effect.gen(function* () {
          const resources = yield* client.listResources();
          return {
            resources: resources.map((resource) => ({
              uri: resource.uri,
              name: resource.name,
              ...(resource.description
                ? { description: resource.description }
                : {}),
              ...(resource.mimeType ? { mimeType: resource.mimeType } : {}),
            })),
          };
        }).pipe(
          Effect.mapError(
            () =>
              new AiError.InvalidUserInputError({
                description: "Unable to list MCP resources",
              }),
          ),
        ),
      read_resource: (input: { uri: string }) =>
        Effect.gen(function* () {
          const result = yield* client.readResource(input.uri).pipe(
            Effect.mapError(
              () =>
                new AiError.InvalidUserInputError({
                  description: `Unable to read MCP resource "${input.uri}"`,
                }),
            ),
          );
          const contents =
            typeof result === "object" && result !== null
              ? (result as { contents?: unknown }).contents
              : undefined;
          if (!Array.isArray(contents)) {
            return yield* Effect.fail(
              new AiError.InvalidUserInputError({
                description: `MCP resource "${input.uri}" response missing contents`,
              }),
            );
          }
          return {
            contents: contents.map((content) => {
              if (typeof content !== "object" || content === null) {
                return {
                  uri: input.uri,
                  mimeType: undefined,
                  text: undefined,
                  _meta: undefined,
                };
              }
              const record = content as Record<string, unknown>;
              const uri =
                typeof record["uri"] === "string" ? record["uri"] : input.uri;
              const mimeType =
                typeof record["mimeType"] === "string"
                  ? record["mimeType"]
                  : undefined;
              const text =
                typeof record["text"] === "string" ? record["text"] : undefined;
              const meta = record["_meta"];
              return {
                uri,
                ...(mimeType ? { mimeType } : {}),
                ...(text ? { text } : {}),
                ...(meta ? { _meta: meta } : {}),
              };
            }),
          };
        }),
    };

    const handlers = toolkit.of(
      Object.assign({}, dynamicHandlers, resourceHandlers) as Parameters<
        typeof toolkit.of
      >[0],
    );

    return {
      toolkit,
      layer: toolkit.toLayer(handlers),
      session,
      tools,
    } as const;
  });

export const McpToolkit = Effect.gen(function* () {
  return yield* createMcpToolkit({});
});

export type McpToolkit = Effect.Success<ReturnType<typeof createMcpToolkit>>;
