import { useApp, useHostStyles } from "@modelcontextprotocol/ext-apps/react";
import * as Plot from "@observablehq/plot";
import { LineChartWidgetPayload } from "@repo/domain/Chart";
import { Option, Schema } from "effect";
import { useEffect, useRef, useState } from "react";

const extractPayloadFromToolResult = (
  params: Parameters<
    NonNullable<NonNullable<ReturnType<typeof useApp>["app"]>["ontoolresult"]>
  >[0],
) => {
  if (params.isError) {
    return null;
  }

  const structured = params.structuredContent;
  const structuredPayload = Schema.decodeUnknownOption(LineChartWidgetPayload)(
    structured,
  );
  if (Option.isSome(structuredPayload)) {
    return structuredPayload.value;
  }

  const text = params.content?.find((item) => item.type === "text")?.text;
  if (text) {
    try {
      return Schema.decodeUnknownSync(LineChartWidgetPayload)(JSON.parse(text));
    } catch {
      return null;
    }
  }

  return null;
};

const LineChart = ({
  data,
  layout,
  marks,
}: typeof LineChartWidgetPayload.Type) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const { width: layoutWidth, ...layoutOptions } = layout;
    const width = layoutWidth ?? measuredWidth ?? undefined;

    const plot = Plot.plot({
      style: "--plot-background: var(--color-background-primary);",
      ...layoutOptions,
      ...(width ? { width } : {}),
      color: {
        ...(layoutOptions.color ? layoutOptions.color : {}),
        scheme: "Category10",
      },
      marks: [
        Plot.ruleY([0]),
        Plot.line(data, {
          ...marks,
          x: marks?.x ?? "x",
          y: marks?.y ?? "y",
        }),
      ],
    });

    containerRef.current.replaceChildren(plot);
    return () => plot.remove();
  }, [data, layout, marks, measuredWidth]);

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
        width: "100%",
        color: "var(--color-text-primary, #111)",
        backgroundColor: "var(--color-background-secondary, #fff)",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
      }}
    >
      <div ref={containerRef} />
    </div>
  );
};

export const WidgetApp = () => {
  const [payload, setPayload] = useState<
    typeof LineChartWidgetPayload.Type | null
  >(null);
  const { app, isConnected, error } = useApp({
    appInfo: { name: "line-chart-widget", version: "0.1.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolinput = (params) => {
        const parsed = Schema.decodeUnknownSync(LineChartWidgetPayload)(
          params.arguments,
        );
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

  return <LineChart {...payload} />;
};
