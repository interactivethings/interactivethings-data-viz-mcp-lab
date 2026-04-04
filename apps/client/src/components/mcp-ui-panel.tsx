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

const hostFontCss =
  '@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap");';

const buildHostStyleVariables = () => {
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const getVar = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;

  return {
    "--color-background-primary": getVar("--background", "#0a0a0a"),
    "--color-background-secondary": getVar("--card", "#111111"),
    "--color-background-tertiary": getVar("--muted", "#1a1a1a"),
    "--color-background-inverse": getVar("--foreground", "#fafafa"),
    "--color-background-ghost": "transparent",
    "--color-background-info": getVar("--accent", "#3b82f6"),
    "--color-background-danger": getVar("--destructive", "#ef4444"),
    "--color-background-success": getVar("--chart-2", "#22c55e"),
    "--color-background-warning": getVar("--chart-4", "#f59e0b"),
    "--color-background-disabled": getVar("--muted", "#1a1a1a"),
    "--color-text-primary": getVar("--foreground", "#fafafa"),
    "--color-text-secondary": getVar("--muted-foreground", "#a1a1aa"),
    "--color-text-tertiary": getVar("--muted-foreground", "#a1a1aa"),
    "--color-text-inverse": getVar("--background", "#0a0a0a"),
    "--color-text-ghost": getVar("--muted-foreground", "#a1a1aa"),
    "--color-text-info": getVar("--accent-foreground", "#0b1020"),
    "--color-text-danger": getVar("--destructive", "#ef4444"),
    "--color-text-success": getVar("--chart-2", "#22c55e"),
    "--color-text-warning": getVar("--chart-4", "#f59e0b"),
    "--color-text-disabled": getVar("--muted-foreground", "#a1a1aa"),
    "--color-border-primary": getVar("--border", "#262626"),
    "--color-border-secondary": getVar("--input", "#262626"),
    "--color-border-tertiary": getVar("--border", "#262626"),
    "--color-border-inverse": getVar("--foreground", "#fafafa"),
    "--color-border-ghost": "transparent",
    "--color-border-info": getVar("--accent", "#3b82f6"),
    "--color-border-danger": getVar("--destructive", "#ef4444"),
    "--color-border-success": getVar("--chart-2", "#22c55e"),
    "--color-border-warning": getVar("--chart-4", "#f59e0b"),
    "--color-border-disabled": getVar("--border", "#262626"),
    "--color-ring-primary": getVar("--ring", "#3b82f6"),
    "--color-ring-secondary": getVar("--ring", "#3b82f6"),
    "--color-ring-inverse": getVar("--background", "#0a0a0a"),
    "--color-ring-info": getVar("--accent", "#3b82f6"),
    "--color-ring-danger": getVar("--destructive", "#ef4444"),
    "--color-ring-success": getVar("--chart-2", "#22c55e"),
    "--color-ring-warning": getVar("--chart-4", "#f59e0b"),
    "--font-sans": getVar(
      "--font-mono",
      "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    ),
    "--font-mono": getVar(
      "--font-mono",
      "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    ),
    "--font-weight-normal": "400",
    "--font-weight-medium": "500",
    "--font-weight-semibold": "600",
    "--font-weight-bold": "700",
    "--font-text-xs-size": "0.75rem",
    "--font-text-sm-size": "0.875rem",
    "--font-text-md-size": "1rem",
    "--font-text-lg-size": "1.125rem",
    "--font-heading-xs-size": "0.75rem",
    "--font-heading-sm-size": "0.875rem",
    "--font-heading-md-size": "1rem",
    "--font-heading-lg-size": "1.25rem",
    "--font-heading-xl-size": "1.5rem",
    "--font-heading-2xl-size": "1.875rem",
    "--font-heading-3xl-size": "2.25rem",
    "--font-text-xs-line-height": "1.4",
    "--font-text-sm-line-height": "1.4",
    "--font-text-md-line-height": "1.5",
    "--font-text-lg-line-height": "1.5",
    "--font-heading-xs-line-height": "1.4",
    "--font-heading-sm-line-height": "1.4",
    "--font-heading-md-line-height": "1.4",
    "--font-heading-lg-line-height": "1.3",
    "--font-heading-xl-line-height": "1.25",
    "--font-heading-2xl-line-height": "1.2",
    "--font-heading-3xl-line-height": "1.1",
    "--border-radius-xs": getVar("--radius-sm", "4px"),
    "--border-radius-sm": getVar("--radius-sm", "4px"),
    "--border-radius-md": getVar("--radius-md", "6px"),
    "--border-radius-lg": getVar("--radius-lg", "8px"),
    "--border-radius-xl": getVar("--radius-xl", "12px"),
    "--border-radius-full": "9999px",
    "--border-width-regular": "1px",
    "--shadow-hairline": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "--shadow-sm":
      "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    "--shadow-md":
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    "--shadow-lg":
      "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  } as const;
};

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
          styles: {
            variables: buildHostStyleVariables(),
            css: {
              fonts: hostFontCss,
            },
          },
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
      bridge.setHostContext({
        theme: resolveTheme(),
        styles: {
          variables: buildHostStyleVariables(),
          css: {
            fonts: hostFontCss,
          },
        },
      });
    });
    onThemeChange.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const sendSandboxResource = () => {
      const existing = resourceState.csp ?? {};
      const resourceDomains = [
        ...(existing.resourceDomains ?? []),
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
      ];
      const payload = {
        html: resourceState.html,
        csp: { ...existing, resourceDomains },
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
  }, [resourceState, toolInput]);

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
      className={cn("mt-2 w-full bg-muted/30", className)}
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
