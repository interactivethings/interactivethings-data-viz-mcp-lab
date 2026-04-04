import { useApp, useHostStyles } from "@modelcontextprotocol/ext-apps/react";
import { Option, Schema } from "effect";
import { useRef, useState } from "react";
import type { HostApp } from "./widget";

type ToolResultContentItem = NonNullable<ToolResultParams["content"]>[number];

type ToolResultParams = Parameters<
  NonNullable<NonNullable<ReturnType<typeof useApp>["app"]>["ontoolresult"]>
>[0];

type AppInfo = {
  name: string;
  version: string;
};

type UseWidgetPayloadOptions = {
  appInfo: AppInfo;
  capabilities?: Record<string, unknown>;
};

type UseWidgetPayloadResult<TPayload> = {
  app: HostApp | null;
  error: Error | null;
  isConnected: boolean;
  payload: TPayload | null;
};

const decodeToolResult = <TSchema extends Schema.Decoder<unknown, never>>(
  schema: TSchema,
  params: ToolResultParams,
): Schema.Schema.Type<TSchema> | null => {
  if (params.isError) {
    return null;
  }

  const structuredPayload = Schema.decodeUnknownOption(schema)(
    params.structuredContent,
  );
  if (Option.isSome(structuredPayload)) {
    return structuredPayload.value as Schema.Schema.Type<TSchema>;
  }

  const text = params.content?.find(
    (item: ToolResultContentItem) => item.type === "text",
  )?.text;
  if (!text) {
    return null;
  }

  try {
    return Schema.decodeUnknownSync(schema)(
      JSON.parse(text),
    ) as Schema.Schema.Type<TSchema>;
  } catch {
    return null;
  }
};

export const useWidgetPayload = <
  TSchema extends Schema.Decoder<unknown, never>,
>(
  schema: TSchema,
  options: UseWidgetPayloadOptions,
): UseWidgetPayloadResult<Schema.Schema.Type<TSchema>> => {
  const [payload, setPayload] = useState<Schema.Schema.Type<TSchema> | null>(
    null,
  );
  const lastPayloadRef = useRef<string | null>(null);

  const { app, isConnected, error } = useApp({
    appInfo: options.appInfo,
    capabilities: options.capabilities ?? {},
    onAppCreated: (nextApp: HostApp) => {
      nextApp.ontoolresult = (params: ToolResultParams) => {
        const nextPayload = decodeToolResult(schema, params);
        if (!nextPayload) {
          return;
        }

        const serialized = JSON.stringify(nextPayload);
        if (lastPayloadRef.current === serialized) {
          return;
        }

        lastPayloadRef.current = serialized;
        setPayload(nextPayload);
      };
    },
  });

  useHostStyles(app, app?.getHostContext());

  return {
    app,
    error,
    isConnected,
    payload,
  };
};
