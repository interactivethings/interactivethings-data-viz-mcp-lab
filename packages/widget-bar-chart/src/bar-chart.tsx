import * as Plot from "@observablehq/plot";
import { BarChartWidgetPayload } from "@repo/domain/Chart";
import {
  type HostApp,
  PlotFigure,
  useWidgetPayload,
  useWidgetResize,
  WidgetFrame,
  WidgetStatus,
} from "@repo/ui";

const BarChart = ({
  data,
  direction,
  layout,
  marks,
  app,
}: typeof BarChartWidgetPayload.Type & { app?: HostApp | null }) => {
  const { frameRef, measuredWidth } = useWidgetResize(app);

  const width = layout?.width ?? measuredWidth ?? undefined;

  const layoutOptions = layout ?? {};
  const { width: _layoutWidth, ...restLayoutOptions } = layoutOptions;
  const isHorizontal = direction === "horizontal";
  const barOptions = {
    ...marks,
    x: marks?.x ?? (isHorizontal ? "value" : "category"),
    y: marks?.y ?? (isHorizontal ? "category" : "value"),
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
            isHorizontal ? Plot.ruleX([0]) : Plot.ruleY([0]),
            isHorizontal
              ? Plot.barX(data, barOptions)
              : Plot.barY(data, barOptions),
          ],
        }}
        dependencies={[data, direction, layout, marks]}
      />
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
