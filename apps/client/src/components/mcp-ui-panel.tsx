import {
  AppBridge,
  buildAllowAttribute,
  type McpUiHostContext,
  type McpUiResourceCsp,
  type McpUiResourcePermissions,
  type McpUiTheme,
  PostMessageTransport,
} from "@modelcontextprotocol/ext-apps/app-bridge";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { buildHostStyleVariables } from "../styles/hostStyles";

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

const serverBaseUrl =
  import.meta.env.VITE_SERVER_URL ?? "http://localhost:9000";

const fetchUiResource = async (uri: string, signal: AbortSignal) => {
  const response = await fetch(
    `${serverBaseUrl}/mcp-ui/resources/${encodeURIComponent(uri)}`,
    {
      signal,
    },
  );
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

const resolveTheme = (): McpUiTheme =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";

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

const useUiResource = (resourceUri: string) => {
  const [resourceState, setResourceState] = useState<UiResourceState>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    setResourceState(null);

    fetchUiResource(resourceUri, controller.signal)
      .then((resource) => setResourceState(resource))
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
      });

    return () => controller.abort();
  }, [resourceUri]);

  return { resourceState, error };
};

const useHostContext = () => {
  const buildContext = useCallback(
    (): McpUiHostContext => ({
      theme: resolveTheme(),
      platform: "web",
      containerDimensions: { width: 900, height: 500 },
      styles: {
        variables: buildHostStyleVariables(),
        css: {
          fonts:
            '@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap");',
        },
      },
    }),
    [],
  );

  const [hostContext, setHostContext] = useState(() => buildContext());

  useEffect(() => {
    const onThemeChange = new MutationObserver(() => {
      setHostContext(buildContext());
    });
    onThemeChange.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => onThemeChange.disconnect();
  }, [buildContext]);

  return hostContext;
};

const useMcpBridge = (params: {
  resourceState: UiResourceState;
  hostContext: McpUiHostContext;
  onHeightChange: (height: number) => void;
}) => {
  const { resourceState, hostContext, onHeightChange } = params;
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [initialized, setInitialized] = useState(false);
  const bridgeRef = useRef<AppBridge | null>(null);
  const hasSentResource = useRef(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !resourceState) return;

    hasSentResource.current = false;
    setInitialized(false);

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
        hostContext,
      },
    );

    bridge.oncalltool = (request) =>
      request.arguments
        ? fetchToolCall({ name: request.name, arguments: request.arguments })
        : fetchToolCall({ name: request.name });
    bridge.onreadresource = (request) =>
      fetchReadResource({ uri: request.uri }) as Promise<any>;
    bridge.onopenlink = async (request: { url: string }) => {
      window.open(request.url, "_blank", "noopener,noreferrer");
      return {};
    };
    bridge.onloggingmessage = (request: { level: string; data: unknown }) => {
      console.info("[MCP UI]", request);
    };
    bridge.onsizechange = ({ height }: { height?: number }) => {
      if (typeof height === "number") {
        onHeightChange(Math.ceil(height));
      }
    };

    const sendSandboxResource = () => {
      if (hasSentResource.current) return;
      hasSentResource.current = true;
      const existing = resourceState.csp ?? {};
      const resourceDomains = [
        ...(existing.resourceDomains ?? []),
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
      ];
      bridge.sendSandboxResourceReady({
        html: resourceState.html,
        csp: { ...existing, resourceDomains },
        ...(resourceState.permissions
          ? { permissions: resourceState.permissions }
          : {}),
      });
    };

    bridge.onsandboxready = () => {
      sendSandboxResource();
    };

    bridge.oninitialized = () => {
      setInitialized(true);
    };

    void bridge.connect(
      new PostMessageTransport(
        iframe.contentWindow as Window,
        iframe.contentWindow as Window,
      ),
    );

    sendSandboxResource();
    bridgeRef.current = bridge;

    return () => {
      bridgeRef.current = null;
      void bridge.teardownResource({}).catch(() => undefined);
    };
  }, [resourceState, hostContext, onHeightChange]);

  useEffect(() => {
    const bridge = bridgeRef.current;
    if (!bridge) return;
    bridge.setHostContext(hostContext);
  }, [hostContext]);

  return { iframeRef, bridge: bridgeRef.current, initialized };
};

const useToolSync = ({
  bridge,
  initialized,
  input,
  result,
}: {
  bridge: AppBridge | null;
  initialized: boolean;
  input?: Record<string, unknown> | undefined;
  result?: { text: string; success?: boolean } | null | undefined;
}) => {
  useEffect(() => {
    if (!bridge || !initialized || !input) return;
    bridge.sendToolInput({ arguments: input });
  }, [bridge, initialized, input]);

  useEffect(() => {
    if (!bridge || !initialized) return;
    const toolResult = buildToolResult(result);
    if (toolResult) {
      bridge.sendToolResult(toolResult);
    }
  }, [bridge, initialized, result]);
};

type McpUiPanelProps = {
  name: string;
  resourceUri: string;
  input?: Record<string, unknown> | undefined;
  result?: { text: string; success?: boolean } | null;
  className?: string;
};

export const McpUiPanel: FC<McpUiPanelProps> = ({
  name,
  resourceUri,
  input,
  result,
  className,
}) => {
  const [frameHeight, setFrameHeight] = useState<number | null>(null);
  const { resourceState, error } = useUiResource(resourceUri);
  const hostContext = useHostContext();
  const { iframeRef, bridge, initialized } = useMcpBridge({
    resourceState,
    hostContext,
    onHeightChange: setFrameHeight,
  });

  const allowAttribute = useMemo(() => {
    if (!resourceState?.permissions) return undefined;
    const allow = buildAllowAttribute(resourceState.permissions);
    return allow.length > 0 ? allow : undefined;
  }, [resourceState?.permissions]);

  useToolSync({ bridge, initialized, input, result });

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
        title={`${name}-ui`}
        className="h-full w-full"
        src="/sandbox-proxy.html"
        sandbox="allow-scripts allow-same-origin allow-forms"
        allow={allowAttribute}
      />
    </div>
  );
};
