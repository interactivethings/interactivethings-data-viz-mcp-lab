import { useApp, useHostStyles } from "@modelcontextprotocol/ext-apps/react";
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
  data: BarChartDatum[];
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
  if (!Array.isArray(dataValue)) {
    return null;
  }

  const data = dataValue.filter(isBarChartDatum);
  if (data.length === 0) {
    return null;
  }

  const propsValue = record["props"];
  const props =
    propsValue && typeof propsValue === "object"
      ? (propsValue as BarChartWidgetProps)
      : undefined;

  return props ? { data, props } : { data };
};

const extractPayloadFromToolResult = (
  params: Parameters<
    NonNullable<NonNullable<ReturnType<typeof useApp>["app"]>["ontoolresult"]>
  >[0],
) => {
  if (params.isError) {
    return null;
  }

  const structured = params.structuredContent;
  const structuredPayload = parsePayload(structured);
  if (structuredPayload) {
    return structuredPayload;
  }

  const text = params.content?.find((item) => item.type === "text")?.text;
  if (text) {
    try {
      return parsePayload(JSON.parse(text));
    } catch {
      return null;
    }
  }

  return null;
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
  const { app, isConnected, error } = useApp({
    appInfo: { name: "bar-chart-widget", version: "0.1.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolinput = (params) => {
        const parsed = parsePayload(params.arguments);
        if (parsed) {
          setPayload(parsed);
        }
      };
      app.ontoolresult = (params) => {
        const parsed = extractPayloadFromToolResult(params);
        if (parsed) {
          setPayload(parsed);
        }
      };
    },
  });

  useHostStyles(app, app?.getHostContext());

  if (error) {
    return <div style={{ padding: 16 }}>Error: {error.message}</div>;
  }

  if (!isConnected) {
    return <div style={{ padding: 16 }}>Connecting…</div>;
  }

  if (!payload) {
    return <div style={{ padding: 16 }}>Waiting for data…</div>;
  }

  const { data, props = {} } = payload;

  return <BarChart data={data} {...props} />;
};
