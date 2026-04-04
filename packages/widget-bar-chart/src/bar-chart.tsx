import * as Plot from "@observablehq/plot";
import { BarChartWidgetPayload } from "@repo/domain/Chart";
import {
  type HostApp,
  usePlotRenderer,
  useWidgetPayload,
  useWidgetResize,
  WidgetFrame,
  WidgetStatus,
} from "@repo/ui";
import { useRef } from "react";

const BarChart = ({
  data,
  direction,
  layout,
  marks,
  app,
}: typeof BarChartWidgetPayload.Type & { app?: HostApp | null }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { frameRef, measuredWidth } = useWidgetResize(app);

  const width = layout?.width ?? measuredWidth ?? undefined;

  usePlotRenderer({
    containerRef,
    ...(width ? { width } : {}),
    dependencies: [data, direction, layout, marks],
    renderPlot: ({ width }: { width?: number }) => {
      const layoutOptions = layout ?? {};
      const { width: _layoutWidth, ...restLayoutOptions } = layoutOptions;
      const isHorizontal = direction === "horizontal";
      const barOptions = {
        ...marks,
        x: marks?.x ?? (isHorizontal ? "value" : "category"),
        y: marks?.y ?? (isHorizontal ? "category" : "value"),
      };

      return Plot.plot({
        style: "--plot-background: var(--color-background-primary);",
        ...restLayoutOptions,
        ...(width ? { width } : {}),
        color: {
          ...(layoutOptions.color ? layoutOptions.color : {}),
          scheme: "Category10",
        },
        marks: [
          isHorizontal ? Plot.ruleX([0]) : Plot.ruleY([0]),
          isHorizontal
            ? Plot.barX(data, barOptions)
            : Plot.barY(data, barOptions),
        ].filter(Boolean),
      });
    },
  });

  return (
    <WidgetFrame frameRef={frameRef}>
      <div ref={containerRef} />
    </WidgetFrame>
  );
};

export const WidgetApp = () => {
  const { app, isConnected, error, payload } = useWidgetPayload(
    BarChartWidgetPayload,
    {
      appInfo: { name: "widget-bar-chart", version: "0.1.0" },
      capabilities: {},
    },
  );

  if (error) {
    return <WidgetStatus message={`Error: ${error.message}`} />;
  }

  if (!isConnected) {
    return <WidgetStatus message="Connecting..." />;
  }

  if (!payload) {
    return <WidgetStatus message="Waiting for data..." />;
  }

  return <BarChart {...payload} app={app} />;
};
