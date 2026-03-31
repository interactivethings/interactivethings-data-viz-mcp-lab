import * as Plot from "@observablehq/plot";
import { useEffect, useRef, useState } from "react";

type BarChartDatum = {
  category: string;
  value: number;
};

type BarChartWidgetProps = {
  title?: string;
  valueLabel?: string;
  maxWidth?: number;
  width?: number;
  height?: number;
  showLabels?: boolean;
  maxY?: number;
};

type BarChartWidgetPayload = {
  data?: BarChartDatum[];
  dataUrl?: string;
  props?: BarChartWidgetProps;
};

const defaultProps: Required<
  Pick<BarChartWidgetProps, "width" | "height" | "showLabels">
> = {
  width: 420,
  height: 260,
  showLabels: true,
};

const isBarChartDatum = (value: unknown): value is BarChartDatum => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record["category"] === "string" &&
    typeof record["value"] === "number"
  );
};

const parsePayload = (value: unknown): BarChartWidgetPayload | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const dataValue = record["data"];
  const data = Array.isArray(dataValue)
    ? dataValue.filter(isBarChartDatum)
    : null;
  const dataUrl =
    typeof record["dataUrl"] === "string" ? record["dataUrl"] : null;
  if (!dataUrl && (!data || data.length === 0)) {
    return null;
  }

  const propsValue = record["props"];
  const props =
    propsValue && typeof propsValue === "object"
      ? (propsValue as BarChartWidgetProps)
      : undefined;

  if (data && data.length > 0) {
    return props ? { data, props } : { data };
  }

  if (dataUrl) {
    return props ? { dataUrl, props } : { dataUrl };
  }

  return null;
};

type ToolResultMessage = {
  method?: string;
  params?: {
    isError?: boolean;
    structuredContent?: unknown;
    content?: Array<{ type: string; text?: string }>;
  };
};

type HostContextMessage = {
  method?: string;
  params?: Record<string, unknown>;
};

const extractPayloadFromMessage = (message: ToolResultMessage) => {
  if (message.method !== "ui/notifications/tool-result") {
    return null;
  }

  if (message.params?.isError) {
    return null;
  }

  const structured = message.params?.structuredContent;
  const structuredPayload = parsePayload(structured);
  if (structuredPayload) {
    return structuredPayload;
  }

  const text = message.params?.content?.find(
    (item) => item.type === "text",
  )?.text;
  if (text) {
    try {
      return parsePayload(JSON.parse(text));
    } catch {
      return null;
    }
  }

  return null;
};

const sendRequest = (method: string, params: Record<string, unknown>) => {
  const id = crypto.randomUUID();
  window.parent.postMessage({ jsonrpc: "2.0", id, method, params }, "*");
  return new Promise<Record<string, unknown> | null>((resolve) => {
    const listener = (event: MessageEvent) => {
      const payload = event.data?.payload ?? event.data;
      if (!payload || payload.id !== id) {
        return;
      }
      window.removeEventListener("message", listener);
      resolve(payload.result ?? null);
    };
    window.addEventListener("message", listener);
  });
};

const applyThemeFromContext = (context: Record<string, unknown>) => {
  const theme = context["theme"];
  if (theme === "light" || theme === "dark") {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }

  const styles = context["styles"];
  if (styles && typeof styles === "object") {
    const stylesRecord = styles as Record<string, unknown>;
    const variables = stylesRecord["variables"];
    if (variables && typeof variables === "object") {
      for (const [key, value] of Object.entries(
        variables as Record<string, unknown>,
      )) {
        if (value !== undefined) {
          document.documentElement.style.setProperty(key, String(value));
        }
      }
    }
  }
};

type BarChartProps = BarChartWidgetProps & {
  data: BarChartDatum[];
};

const BarChart = ({
  data,
  title,
  valueLabel,
  maxWidth,
  width,
  height = defaultProps.height,
  showLabels = defaultProps.showLabels,
  maxY,
}: BarChartProps) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const yOptions: Plot.ScaleOptions = { grid: true };
    if (valueLabel !== undefined) {
      yOptions.label = valueLabel;
    }
    if (maxY !== undefined) {
      yOptions.domain = [0, maxY];
    }

    const plotWidth = width ?? measuredWidth ?? defaultProps.width;
    const plot = Plot.plot({
      style: "--plot-background: var(--color-background-primary);",
      width: plotWidth,
      height,
      marginLeft: 48,
      marginBottom: 40,
      y: yOptions,
      marks: [
        Plot.ruleY([0]),
        Plot.barY(data, {
          x: "category",
          y: "value",
          fill: "#38bdf8",
          tip: "xy",
        }),
        showLabels
          ? Plot.text(data, {
              x: "category",
              y: "value",
              text: (d: BarChartDatum) => d.value,
              dy: -6,
              fill: "currentColor",
              fontSize: 12,
            })
          : null,
      ].filter(Boolean),
    });

    containerRef.current.replaceChildren(plot);
    return () => plot.remove();
  }, [data, height, maxY, measuredWidth, showLabels, valueLabel, width]);

  useEffect(() => {
    if (!wrapperRef.current) {
      return undefined;
    }

    const element = wrapperRef.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const nextWidth = Math.floor(entry.contentRect.width);
      if (Number.isFinite(nextWidth) && nextWidth > 0) {
        setMeasuredWidth(nextWidth);
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{
        maxWidth,
        width: "100%",
        color: "var(--color-text-primary, #111)",
        backgroundColor: "var(--color-background-secondary, #fff)",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
      }}
    >
      {title ? <h2 style={{ margin: "0 0 12px" }}>{title}</h2> : null}
      <div ref={containerRef} />
    </div>
  );
};

export const WidgetApp = () => {
  const [payload, setPayload] = useState<BarChartWidgetPayload | null>(null);
  const [resolved, setResolved] = useState<BarChartWidgetPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (
      event: MessageEvent<ToolResultMessage | HostContextMessage>,
    ) => {
      const message = event.data ?? {};
      if (message.method === "ui/notifications/host-context-changed") {
        const context = (message.params ?? {}) as Record<string, unknown>;
        applyThemeFromContext(context);
        return;
      }

      const parsed = extractPayloadFromMessage(message);
      if (parsed) {
        setPayload(parsed);
      }
    };

    window.addEventListener("message", handleMessage);
    sendRequest("ui/initialize", {
      appCapabilities: {},
      appInfo: { name: "bar-chart-widget", version: "0.1.0" },
      protocolVersion: "2026-01-26",
    }).then((result) => {
      const hostContext = result?.["hostContext"];
      if (hostContext && typeof hostContext === "object") {
        applyThemeFromContext(hostContext as Record<string, unknown>);
      }
    });

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    if (!payload) {
      setResolved(null);
      setLoadError(null);
      return undefined;
    }

    if (payload.data) {
      setResolved(payload);
      setLoadError(null);
      return undefined;
    }

    if (!payload.dataUrl) {
      setResolved(null);
      setLoadError("Missing data or dataUrl");
      return undefined;
    }

    const controller = new AbortController();
    const load = async () => {
      try {
        setLoadError(null);
        setResolved(null);
        const response = await fetch(payload.dataUrl as string, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`);
        }
        const json = await response.json();
        const nextData = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
            ? json.data
            : [];
        const data = nextData.filter(isBarChartDatum);
        if (data.length === 0) {
          throw new Error("No valid data points");
        }
        setResolved(payload.props ? { data, props: payload.props } : { data });
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(
            error instanceof Error ? error.message : "Failed to load data",
          );
        }
      }
    };

    void load();
    return () => controller.abort();
  }, [payload]);

  if (!payload) {
    return <div style={{ padding: 16 }}>Waiting for data…</div>;
  }

  if (loadError) {
    return <div style={{ padding: 16 }}>Failed to load data: {loadError}</div>;
  }

  if (!resolved?.data) {
    return <div style={{ padding: 16 }}>Loading data…</div>;
  }

  const { data, props = {} } = resolved;

  return <BarChart data={data} {...props} />;
};
