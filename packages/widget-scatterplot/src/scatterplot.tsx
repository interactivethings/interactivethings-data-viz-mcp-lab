import * as Plot from "@observablehq/plot";
import { ScatterplotWidgetPayload } from "@repo/domain/Chart";
import {
  type HostApp,
  usePlotRenderer,
  useWidgetPayload,
  useWidgetResize,
  WidgetFrame,
  WidgetStatus,
} from "@repo/ui";
import { useRef } from "react";

const Scatterplot = ({
  data,
  layout,
  marks,
  app,
}: typeof ScatterplotWidgetPayload.Type & {
  app?: HostApp | null;
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { frameRef, measuredWidth } = useWidgetResize(app);

  const width = layout?.width ?? measuredWidth ?? undefined;

  usePlotRenderer({
    containerRef,
    ...(width ? { width } : {}),
    dependencies: [data, layout, marks],
    renderPlot: ({ width }: { width?: number }) => {
      const layoutOptions = layout ?? {};
      const { width: _layoutWidth, ...restLayoutOptions } = layoutOptions;

      return Plot.plot({
        style: "--plot-background: var(--color-background-primary);",
        ...restLayoutOptions,
        ...(width ? { width } : {}),
        color: {
          ...(layoutOptions.color ? layoutOptions.color : {}),
          scheme: "Category10",
        },
        marks: [
          Plot.ruleX([0]),
          Plot.ruleY([0]),
          Plot.dot(data, {
            ...marks,
            x: marks?.x ?? "x",
            y: marks?.y ?? "y",
          }),
        ],
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
    ScatterplotWidgetPayload,
    {
      appInfo: { name: "widget-scatterplot", version: "0.1.0" },
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

  return <Scatterplot {...payload} app={app} />;
};
