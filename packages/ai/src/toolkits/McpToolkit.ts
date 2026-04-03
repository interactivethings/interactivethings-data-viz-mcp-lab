import { Effect, Layer, Schema } from "effect";
import type { McpSchema } from "effect/unstable/ai";
import { Tool, Toolkit } from "effect/unstable/ai";
import { McpClient } from "../services/McpClient";

type McpToolkitOptions = {
  readonly namePrefix?: string;
};

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
    const tools = (yield* client.listAllTools()).filter(isVisibleToModel);

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

    const toolkit = Toolkit.make(...dynamicTools);

    const handlers = toolkit.of(
      Object.fromEntries(
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

              const result = yield* client.toolCall({
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
      ),
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
