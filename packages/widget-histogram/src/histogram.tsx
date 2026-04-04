import * as Plot from "@observablehq/plot";
import { HistogramWidgetPayload } from "@repo/domain/Chart";
import {
  type HostApp,
  PlotFigure,
  useWidgetPayload,
  useWidgetResize,
  WidgetFrame,
  WidgetStatus,
} from "@repo/ui";

const Histogram = ({
  data,
  layout,
  marks,
  app,
}: typeof HistogramWidgetPayload.Type & { app?: HostApp | null }) => {
  const { frameRef, measuredWidth } = useWidgetResize(app);

  const width = layout?.width ?? measuredWidth ?? undefined;
  const layoutOptions = layout ?? {};
  const { width: _layoutWidth, ...restLayoutOptions } = layoutOptions;
  const series = marks?.series;

  const binOptions = {
    x: marks?.x ?? "value",
    ...(series ? { fill: series } : {}),
    ...(marks?.interval ? { interval: marks.interval } : {}),
    ...(marks?.thresholds ? { thresholds: marks.thresholds } : {}),
    inset: 0.5,
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
            Plot.rectY(data, Plot.binX({ y: "count" }, binOptions)),
          ],
        }}
        dependencies={[data, layout, marks]}
      />
    </WidgetFrame>
  );
};

export const WidgetApp = () => {
  const { app, isConnected, error, payload } = useWidgetPayload(
    HistogramWidgetPayload,
    {
      appInfo: { name: "widget-histogram", version: "0.1.0" },
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

  return <Histogram {...payload} app={app} />;
};
