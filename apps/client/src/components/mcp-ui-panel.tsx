import {
  AppBridge,
  buildAllowAttribute,
  type McpUiResourceCsp,
  type McpUiResourcePermissions,
  PostMessageTransport,
} from "@modelcontextprotocol/ext-apps/app-bridge";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const hostInfo = { name: "bevr-client", version: "0.0.1" };

type UiResourceResponse = {
  uri: string;
  html: string;
  meta: {
    csp?: McpUiResourceCsp;
    permissions?: McpUiResourcePermissions;
    prefersBorder?: boolean;
  } | null;
};

type UiResourceState = {
  html: string;
  csp?: McpUiResourceCsp | undefined;
  permissions?: McpUiResourcePermissions | undefined;
  prefersBorder?: boolean | undefined;
} | null;

type McpUiPanelProps = {
  toolName: string;
  toolResourceUri: string;
  toolInput?: Record<string, unknown> | undefined;
  toolResult?: { text: string; success?: boolean } | null;
  className?: string;
};

const serverBaseUrl =
  import.meta.env.VITE_SERVER_URL ?? "http://localhost:9000";

const fetchUiResource = async (uri: string, signal: AbortSignal) => {
  const encoded = encodeURIComponent(uri);
  const response = await fetch(`${serverBaseUrl}/mcp-ui/resources/${encoded}`, {
    signal,
  });
  if (!response.ok) {
    throw new Error(`Failed to load UI resource (${response.status})`);
  }
  const body = (await response.json()) as UiResourceResponse;
  const base = {
    html: body.html,
    ...(body.meta?.csp ? { csp: body.meta.csp } : {}),
    ...(body.meta?.permissions ? { permissions: body.meta.permissions } : {}),
  };
  return body.meta?.prefersBorder === undefined
    ? base
    : ({
        ...base,
        prefersBorder: body.meta.prefersBorder,
      } satisfies UiResourceState);
};

const fetchToolCall = async (params: {
  name: string;
  arguments?: Record<string, unknown>;
}) => {
  const response = await fetch(`${serverBaseUrl}/mcp-ui/tools/call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error(`Tool call failed (${response.status})`);
  }
  return (await response.json()) as CallToolResult;
};

const fetchReadResource = async (params: { uri: string }) => {
  const response = await fetch(`${serverBaseUrl}/mcp-ui/resources/read`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error(`Resource read failed (${response.status})`);
  }
  return (await response.json()) as unknown;
};

const parseJsonPayload = (value: string) => {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const normalizeToolInput = (input?: Record<string, unknown>) => {
  if (!input) return undefined;
  const payload = input["payload"];
  if (typeof payload === "string") {
    const parsed = parseJsonPayload(payload);
    return parsed ?? input;
  }
  return input;
};

const buildToolResult = (
  toolResult?: {
    text: string;
    success?: boolean;
  } | null,
): CallToolResult | null => {
  if (!toolResult) return null;
  const structured = parseJsonPayload(toolResult.text);
  return {
    content: [{ type: "text", text: toolResult.text }],
    ...(structured ? { structuredContent: structured } : {}),
    isError: toolResult.success === false ? true : undefined,
  };
};

const resolveTheme = () =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";

export function McpUiPanel({
  toolName,
  toolResourceUri,
  toolInput,
  toolResult,
  className,
}: McpUiPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const bridgeRef = useRef<AppBridge | null>(null);
  const [resourceState, setResourceState] = useState<UiResourceState>(null);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frameHeight, setFrameHeight] = useState<number | null>(null);

  const allowAttribute = useMemo(() => {
    if (!resourceState?.permissions) return undefined;
    const allow = buildAllowAttribute(resourceState.permissions);
    return allow.length > 0 ? allow : undefined;
  }, [resourceState?.permissions]);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    setResourceState(null);
    setInitialized(false);

    fetchUiResource(toolResourceUri, controller.signal)
      .then((resource) => setResourceState(resource))
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
      });

    return () => controller.abort();
  }, [toolResourceUri]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !resourceState) return;

    const bridge = new AppBridge(
      null,
      hostInfo,
      {
        openLinks: {},
        serverTools: {},
        serverResources: {},
        logging: {},
        updateModelContext: { text: {} },
      },
      {
        hostContext: {
          theme: resolveTheme(),
          platform: "web",
          containerDimensions: { width: 900, height: 500 },
        },
      },
    );

    bridge.oncalltool = async (params) =>
      params.arguments
        ? fetchToolCall({ name: params.name, arguments: params.arguments })
        : fetchToolCall({ name: params.name });
    bridge.onreadresource = async (params) =>
      fetchReadResource({ uri: params.uri }) as Promise<any>;
    bridge.onopenlink = async (params: { url: string }) => {
      window.open(params.url, "_blank", "noopener,noreferrer");
      return {};
    };
    bridge.onloggingmessage = (params: { level: string; data: unknown }) => {
      console.info("[MCP UI]", params);
    };
    bridge.onsizechange = ({ height }: { height?: number }) => {
      if (typeof height === "number") {
        setFrameHeight(Math.ceil(height));
      }
    };

    const onThemeChange = new MutationObserver(() => {
      bridge.setHostContext({ theme: resolveTheme() });
    });
    onThemeChange.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const sendSandboxResource = () => {
      const payload = {
        html: resourceState.html,
        ...(resourceState.csp ? { csp: resourceState.csp } : {}),
        ...(resourceState.permissions
          ? { permissions: resourceState.permissions }
          : {}),
      };
      bridge.sendSandboxResourceReady(payload);
    };

    bridge.onsandboxready = () => {
      sendSandboxResource();
    };

    bridge.oninitialized = () => {
      setInitialized(true);
      const normalized = normalizeToolInput(toolInput);
      if (normalized) {
        bridge.sendToolInput({ arguments: normalized });
      }
    };

    void bridge.connect(
      new PostMessageTransport(
        iframe.contentWindow as Window,
        iframe.contentWindow as Window,
      ),
    );

    setTimeout(() => {
      sendSandboxResource();
    }, 0);

    bridgeRef.current = bridge;

    return () => {
      onThemeChange.disconnect();
      bridgeRef.current = null;
      void bridge.teardownResource({}).catch(() => undefined);
    };
  }, [resourceState, toolName, toolResourceUri, toolInput]);

  useEffect(() => {
    const bridge = bridgeRef.current;
    if (!bridge || !initialized) return;
    const normalized = normalizeToolInput(toolInput);
    if (!normalized) return;
    bridge.sendToolInput({ arguments: normalized });
  }, [toolInput, initialized]);

  useEffect(() => {
    const bridge = bridgeRef.current;
    if (!bridge || !initialized) return;
    const result = buildToolResult(toolResult);
    if (!result) return;
    bridge.sendToolResult(result);
  }, [toolResult, initialized]);

  if (error) {
    return <div className="text-xs text-destructive">UI error: {error}</div>;
  }

  return (
    <div
      className={cn(
        "mt-2 w-full border border-border bg-muted/30",
        resourceState?.prefersBorder === false && "border-transparent",
        className,
      )}
      style={frameHeight ? { height: frameHeight } : undefined}
    >
      <iframe
        ref={iframeRef}
        title={`${toolName}-ui`}
        className="h-full w-full"
        src="/sandbox-proxy.html"
        sandbox="allow-scripts allow-same-origin allow-forms"
        allow={allowAttribute}
      />
    </div>
  );
}
