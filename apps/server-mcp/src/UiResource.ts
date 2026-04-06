import { Effect, FileSystem, Layer, Schema } from "effect";
import { McpServer, Tool } from "effect/unstable/ai";

const UiResourceMimeType = "text/html;profile=mcp-app";

type UiMeta = {
  prefersBorder?: boolean;
  csp?: {
    resourceDomains?: string[];
    connectDomains?: string[];
    frameDomains?: string[];
    baseUriDomains?: string[];
  };
  domain?: string;
};

type UiResourceSpec<E, R> = {
  name: string;
  description: string;
  html: Effect.Effect<string, E, R>;
  meta?: UiMeta;
};

export const readPublicAsset = (options: {
  importMetaDir: string;
  sourceSuffix: string;
  sourcePath: string;
  distPath: string;
}) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const assetPath = options.importMetaDir.endsWith(options.sourceSuffix)
      ? `${options.importMetaDir}/${options.sourcePath}`
      : `${options.importMetaDir}/${options.distPath}`;
    return yield* fs.readFileString(assetPath);
  });

export const makeUiResource = <E, R>(uri: string, spec: UiResourceSpec<E, R>) =>
  Layer.unwrap(
    Effect.map(spec.html, (html) =>
      McpServer.resource({
        uri,
        name: spec.name,
        description: spec.description,
        mimeType: UiResourceMimeType,
        content: Effect.succeed({
          contents: [
            {
              uri,
              mimeType: UiResourceMimeType,
              text: html,
              _meta: spec.meta ? { ui: spec.meta } : undefined,
            },
          ],
        }),
      }),
    ),
  );

export const makeUiRenderTool = <
  const Name extends string,
  Parameters extends Schema.Top,
  Success extends Schema.Top,
>(
  resourceUri: string,
  spec: {
    name: Name;
    title: string;
    description: string;
    parameters: Parameters;
    success: Success;
  },
) =>
  Tool.make(spec.name, {
    description: spec.description,
    parameters: spec.parameters,
    success: spec.success,
    failure: Schema.Never,
  })
    .annotate(Tool.Title, spec.title)
    .annotate(Tool.Meta, {
      ui: { resourceUri },
    });

export const makeUiAppTool = <
  const Name extends string,
  Parameters extends Schema.Top,
  Success extends Schema.Top,
>(spec: {
  name: Name;
  description: string;
  parameters: Parameters;
  success: Success;
}) =>
  Tool.make(spec.name, {
    description: spec.description,
    parameters: spec.parameters,
    success: spec.success,
    failure: Schema.Never,
  }).annotate(Tool.Meta, { ui: { visibility: ["app"] } });
