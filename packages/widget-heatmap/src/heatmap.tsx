import * as Plot from "@observablehq/plot";
import { HeatmapWidgetPayload } from "@repo/domain/Chart";
import {
  type HostApp,
  PlotFigure,
  useWidgetPayload,
  useWidgetResize,
  WidgetFrame,
  WidgetStatus,
} from "@repo/ui";

const Heatmap = ({
  data,
  layout,
  marks,
  app,
}: typeof HeatmapWidgetPayload.Type & { app?: HostApp | null }) => {
  const { frameRef, measuredWidth } = useWidgetResize(app);

  const width = layout?.width ?? measuredWidth ?? undefined;
  const layoutOptions = layout ?? {};
  const { width: _layoutWidth, ...restLayoutOptions } = layoutOptions;
  const x = marks?.x ?? "x";
  const y = marks?.y ?? "y";
  const value = marks?.value ?? "value";

  const cellOptions = {
    x,
    y,
    fill: value,
    stroke: "white",
    strokeOpacity: 0.5,
    strokeWidth: 1,
    inset: 0.5,
    tip: true,
  };

  return (
    <WidgetFrame frameRef={frameRef}>
      <PlotFigure
        options={{
          ...restLayoutOptions,
          padding: 0,
          ...(width ? { width } : {}),
          color: {
            ...(layoutOptions.color ? layoutOptions.color : {}),
            scheme: "YlGnBu",
          },
          marks: [Plot.cell(data, cellOptions)],
        }}
        dependencies={[data, layout, marks]}
      />
    </WidgetFrame>
  );
};

export const WidgetApp = () => {
  const { app, isConnected, error, payload } = useWidgetPayload(
    HeatmapWidgetPayload,
    {
      appInfo: { name: "widget-heatmap", version: "0.1.0" },
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

  return <Heatmap {...payload} app={app} />;
};
