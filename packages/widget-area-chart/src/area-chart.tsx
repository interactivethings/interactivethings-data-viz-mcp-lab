import * as Plot from "@observablehq/plot";
import { AreaChartWidgetPayload } from "@repo/domain/Chart";
import {
  type HostApp,
  PlotFigure,
  useWidgetPayload,
  useWidgetResize,
  WidgetFrame,
  WidgetStatus,
} from "@repo/ui";

const AreaChart = ({
  data,
  layout,
  marks,
  app,
}: typeof AreaChartWidgetPayload.Type & { app?: HostApp | null }) => {
  const { frameRef, measuredWidth } = useWidgetResize(app);

  const width = layout?.width ?? measuredWidth ?? undefined;
  const layoutOptions = layout ?? {};
  const { width: _layoutWidth, ...restLayoutOptions } = layoutOptions;
  const x = marks?.x ?? "x";
  const y = marks?.y ?? "y";
  const series = marks?.series;
  const variant = marks?.variant ?? "area-line";
  const shouldShowLine = variant === "area-line";

  const areaOptions = {
    x,
    y,
    ...(series ? { z: series, fill: series } : {}),
    fillOpacity: 0.3,
    ...(marks?.interval ? { interval: marks.interval } : {}),
    ...(marks?.sort ? { sort: marks.sort } : {}),
    tip: true,
  };

  const lineOptions = {
    x,
    y,
    ...(series ? { z: series, stroke: series } : {}),
    strokeWidth: 2,
    ...(marks?.interval ? { interval: marks.interval } : {}),
    ...(marks?.sort ? { sort: marks.sort } : {}),
    tip: true,
  };

  return (
    <WidgetFrame frameRef={frameRef}>
      <PlotFigure
        options={{
          ...restLayoutOptions,
          ...(width ? { width } : {}),
          color: {
            ...(layoutOptions.color ? layoutOptions.color : {}),
            scheme: "Category10",
          },
          marks: [
            Plot.ruleY([0]),
            Plot.areaY(data, areaOptions),
            shouldShowLine ? Plot.lineY(data, lineOptions) : null,
          ].filter(Boolean),
        }}
        dependencies={[data, layout, marks]}
      />
    </WidgetFrame>
  );
};

export const WidgetApp = () => {
  const { app, isConnected, error, payload } = useWidgetPayload(
    AreaChartWidgetPayload,
    {
      appInfo: { name: "widget-area-chart", version: "0.1.0" },
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

  return <AreaChart {...payload} app={app} />;
};
