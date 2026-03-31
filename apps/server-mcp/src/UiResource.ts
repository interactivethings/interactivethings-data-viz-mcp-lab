import { Effect, Layer, Schema } from "effect";
import { McpServer, Tool } from "effect/unstable/ai";

const UiResourceMimeType = "text/html;profile=mcp-app";
const AppsSdkResourceMimeType = "text/html+skybridge";
const AppsSdkAdapterScript = `
<script>
(function() {
  function installAdapter() {
    if (!window.openai) return false;
    var originalPostMessage = window.parent.postMessage.bind(window.parent);
    window.parent.postMessage = function(message, targetOrigin, transfer) {
      try {
        if (message && message.jsonrpc === "2.0" && message.method === "tools/call") {
          var params = message.params || {};
          var name = params.name;
          var args = params.arguments || {};
          return window.openai.callTool(name, args);
        }
      } catch (_error) {
        // fall through to original postMessage
      }
      return originalPostMessage(message, targetOrigin, transfer);
    };
    return true;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installAdapter);
  } else {
    installAdapter();
  }
})();
</script>
`.trim();

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
  withAppsSdk?: boolean;
};

const buildAppsSdkMeta = <E, R>(spec: UiResourceSpec<E, R>) => {
  const result: { ui?: Schema.Json } & Record<string, Schema.Json> = {};

  if (spec.meta) {
    result.ui = spec.meta;
  }
  if (spec.description !== undefined) {
    result["openai/widgetDescription"] = spec.description;
  }
  if (spec.meta?.prefersBorder !== undefined) {
    result["openai/widgetPrefersBorder"] = spec.meta.prefersBorder;
  }
  if (spec.meta?.csp !== undefined) {
    result["openai/widgetCSP"] = spec.meta.csp;
  }
  if (spec.meta?.domain !== undefined) {
    result["openai/widgetDomain"] = spec.meta.domain;
  }

  return Object.keys(result).length ? result : undefined;
};

export const makeUiResource = <E, R>(uri: string, spec: UiResourceSpec<E, R>) =>
  Layer.unwrap(
    Effect.map(spec.html, (html) => {
      const appsSdkHtml = `${AppsSdkAdapterScript}${html}`;
      const appResource = McpServer.resource({
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
      });

      if (!spec.withAppsSdk) {
        return appResource;
      }

      const appsSdkResource = McpServer.resource({
        uri: `${uri}/apps-sdk`,
        name: spec.name,
        description: spec.description,
        mimeType: AppsSdkResourceMimeType,
        content: Effect.succeed({
          contents: [
            {
              uri: `${uri}/apps-sdk`,
              mimeType: AppsSdkResourceMimeType,
              text: appsSdkHtml,
              _meta: buildAppsSdkMeta(spec),
            },
          ],
        }),
      });

      return Layer.mergeAll(appResource, appsSdkResource);
    }),
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
    openai?: {
      widgetAccessible?: boolean;
      visibility?: "public" | "private";
      toolInvocation?: {
        invoking?: string;
        invoked?: string;
      };
    };
  },
) =>
  Tool.make(spec.name, {
    description: spec.description,
    parameters: spec.parameters,
    success: spec.success,
    failure: Schema.Never,
  })
    .annotate(Tool.Title, spec.title)
    .annotate(Tool.Readonly, true)
    .annotate(Tool.Destructive, false)
    .annotate(Tool.OpenWorld, false)
    .annotate(Tool.Idempotent, true)
    .annotate(Tool.Meta, {
      ui: { resourceUri },
      "openai/outputTemplate": `${resourceUri}/apps-sdk`,
      ...(spec.openai?.widgetAccessible !== undefined
        ? { "openai/widgetAccessible": spec.openai.widgetAccessible }
        : {}),
      ...(spec.openai?.visibility !== undefined
        ? { "openai/visibility": spec.openai.visibility }
        : {}),
      ...(spec.openai?.toolInvocation?.invoking !== undefined
        ? {
            "openai/toolInvocation/invoking":
              spec.openai.toolInvocation.invoking,
          }
        : {}),
      ...(spec.openai?.toolInvocation?.invoked !== undefined
        ? {
            "openai/toolInvocation/invoked": spec.openai.toolInvocation.invoked,
          }
        : {}),
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
  })
    .annotate(Tool.Readonly, true)
    .annotate(Tool.Destructive, false)
    .annotate(Tool.OpenWorld, false)
    .annotate(Tool.Idempotent, true)
    .annotate(Tool.Meta, { ui: { visibility: ["app"] } });
