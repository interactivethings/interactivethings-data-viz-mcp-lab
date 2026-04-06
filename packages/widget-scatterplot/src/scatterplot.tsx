import * as Plot from "@observablehq/plot";
import { ScatterplotWidgetPayload } from "@repo/domain/Chart";
import {
  type HostApp,
  PlotFigure,
  useWidgetPayload,
  useWidgetResize,
  WidgetFrame,
  WidgetStatus,
} from "@repo/ui";

const Scatterplot = ({
  data,
  layout,
  marks,
  app,
}: typeof ScatterplotWidgetPayload.Type & {
  app?: HostApp | null;
}) => {
  const { frameRef, measuredWidth } = useWidgetResize(app);

  const width = layout?.width ?? measuredWidth ?? undefined;
  const layoutOptions = layout ?? {};
  const { width: _layoutWidth, ...restLayoutOptions } = layoutOptions;
  const x = marks?.x ?? "x";
  const y = marks?.y ?? "y";
  const series = marks?.series;
  const dotOptions = {
    x,
    y,
    ...(series ? { fill: series, stroke: series } : {}),
    ...(marks?.size ? { r: marks.size } : {}),
    ...(marks?.sort !== undefined ? { sort: marks.sort } : {}),
    strokeWidth: 1.5,
    fillOpacity: 0.8,
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
          marks: [Plot.ruleX([0]), Plot.ruleY([0]), Plot.dot(data, dotOptions)],
        }}
        dependencies={[data, layout, marks]}
      />
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
