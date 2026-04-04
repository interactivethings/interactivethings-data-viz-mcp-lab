import type { ChatStreamPart } from "@repo/domain/Chat";
import { Cause, Effect, Layer, Queue, ServiceMap, String } from "effect";
import { Chat, type LanguageModel, Prompt, Toolkit } from "effect/unstable/ai";
import { McpToolkit } from "../toolkits/McpToolkit";
import { SampleToolkit } from "../toolkits/SampleToolkit";
import { runAgenticLoop } from "../workflow/AgenticLoop";

export type ChatServiceApi = {
  chat: (
    history: Array<Prompt.Message>,
  ) => Effect.Effect<
    Queue.Queue<typeof ChatStreamPart.Type, Cause.Done>,
    never,
    LanguageModel.LanguageModel
  >;
};

export class ChatService extends ServiceMap.Service<ChatServiceApi>()(
  "ChatService",
  {
    make: Effect.gen(function* () {
      const chat = Effect.fn("chat")(function* (
        history: Array<Prompt.Message>,
      ) {
        const queue = yield* Queue.make<
          typeof ChatStreamPart.Type,
          Cause.Done
        >();

        yield* Effect.forkScoped(
          Effect.gen(function* () {
            const systemMessage = String.stripMargin(`
              |You are a helpful general assistant.
              |You have access to tools and should use them when appropriate.
              |Be concise and direct in your responses.
              |
              |Before using any render_*_widget tool, first call list_resources to see available guidance.
              |If a data visualization resource exists (e.g., app://data-visualization), read it with read_resource and follow its guidance.
              |
              |For MCP chart tools (render_*_widget), pass arguments as JSON in a string field named "payload".
              |Example: { "payload": "{"data":[{"x":1,"y":2}],"marks":{"x":"x","y":"y"}}" }
            `);

            const session = yield* Chat.fromPrompt(
              Prompt.make(history).pipe(Prompt.setSystem(systemMessage)),
            );

            const mcpToolkit = yield* McpToolkit.pipe(
              Effect.catch((error) =>
                Effect.gen(function* () {
                  yield* Effect.logError(
                    `MCP toolkit unavailable: ${
                      error instanceof Error
                        ? error.message
                        : globalThis.String(error)
                    }`,
                  );
                  return {
                    toolkit: Toolkit.empty,
                    layer: Layer.empty,
                    tools: [],
                  } as const;
                }),
              ),
            );

            const mergedToolkit = Toolkit.merge(
              SampleToolkit,
              mcpToolkit.toolkit,
            );
            yield* Effect.log(
              `Toolkits ready: sample=${Object.keys(SampleToolkit.tools).length}, mcp=${mcpToolkit.tools.length}`,
            );
            const toolkit = yield* mergedToolkit
              .asEffect()
              .pipe(Effect.provide(mcpToolkit.layer));

            yield* runAgenticLoop({
              chat: session,
              queue,
              toolkit,
            });
          }).pipe(
            Effect.catchCause((cause) =>
              Effect.gen(function* () {
                yield* Effect.logError(`Chat error: ${cause}`);
                yield* Queue.offer(queue, {
                  _tag: "error",
                  message: `System error: ${Cause.pretty(cause)}`,
                  recoverable: false,
                });
              }),
            ),
            Effect.ensuring(Queue.end(queue)),
          ),
        );

        return queue;
      });

      return { chat } as const;
    }),
  },
) {}

export const ChatServiceLive = Layer.effect(ChatService)(ChatService.make);
