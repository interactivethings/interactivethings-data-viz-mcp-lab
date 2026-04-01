import { useApp, useHostStyles } from "@modelcontextprotocol/ext-apps/react";
import * as Plot from "@observablehq/plot";
import { BarChartWidgetPayload } from "@repo/domain/Chart";
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
  const structuredPayload = Schema.decodeUnknownOption(BarChartWidgetPayload)(
    structured,
  );
  if (Option.isSome(structuredPayload)) {
    return structuredPayload.value;
  }

  const text = params.content?.find((item) => item.type === "text")?.text;
  if (text) {
    try {
      return Option.getOrNull(
        Schema.decodeUnknownOption(BarChartWidgetPayload)(JSON.parse(text)),
      );
    } catch {
      return null;
    }
  }

  return null;
};

const BarChart = ({
  data,
  direction,
  layout,
  marks,
}: typeof BarChartWidgetPayload.Type) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const { width: layoutWidth, ...layoutOptions } = layout ?? {};
    const plotWidth = layoutWidth ?? measuredWidth ?? undefined;
    const isHorizontal = direction === "horizontal";
    const barOptions = (marks ?? {}) as Plot.BarXOptions | Plot.BarYOptions;
    const defaultX = marks?.x ?? (isHorizontal ? "value" : "category");
    const defaultY = marks?.y ?? (isHorizontal ? "category" : "value");
    if (defaultX !== undefined) {
      barOptions.x = defaultX;
    }
    if (defaultY !== undefined) {
      barOptions.y = defaultY;
    }
    const barMark = isHorizontal
      ? Plot.barX(data, barOptions)
      : Plot.barY(data, barOptions);
    const ruleMark = isHorizontal ? Plot.ruleX([0]) : Plot.ruleY([0]);
    const plotOptions: Plot.PlotOptions = {
      style: "--plot-background: var(--color-background-primary);",
      ...layoutOptions,
      color: {
        ...(layoutOptions.color ? layoutOptions.color : {}),
        scheme: "Category10",
      },
      marks: [ruleMark, barMark].filter(Boolean),
    };
    if (plotWidth !== undefined) {
      plotOptions.width = plotWidth;
    }
    const plot = Plot.plot(plotOptions);

    containerRef.current.replaceChildren(plot);
    return () => plot.remove();
  }, [data, layout, marks, measuredWidth, direction]);

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
    typeof BarChartWidgetPayload.Type | null
  >(null);
  const { app, isConnected, error } = useApp({
    appInfo: { name: "bar-chart-widget", version: "0.1.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolinput = (params) => {
        const parsed = Option.getOrNull(
          Schema.decodeUnknownOption(BarChartWidgetPayload)(params.arguments),
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

  return <BarChart {...payload} />;
};
