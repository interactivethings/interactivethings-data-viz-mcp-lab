import * as Plot from "@observablehq/plot";
import { BoxPlotWidgetPayload } from "@repo/domain/Chart";
import {
  type HostApp,
  PlotFigure,
  useWidgetPayload,
  useWidgetResize,
  WidgetFrame,
  WidgetStatus,
} from "@repo/ui";

const BoxPlot = ({
  data,
  direction,
  layout,
  marks,
  app,
}: typeof BoxPlotWidgetPayload.Type & { app?: HostApp | null }) => {
  const { frameRef, measuredWidth } = useWidgetResize(app);

  const width = layout?.width ?? measuredWidth ?? undefined;
  const layoutOptions = layout ?? {};
  const { width: _layoutWidth, ...restLayoutOptions } = layoutOptions;
  const isHorizontal = direction === "horizontal";
  const groupField = marks?.group ?? "category";
  const valueField = marks?.value ?? "value";

  const boxOptions = {
    x: isHorizontal ? valueField : groupField,
    y: isHorizontal ? groupField : valueField,
    fill: groupField,
    fillOpacity: 0.35,
    stroke: "currentColor",
    strokeWidth: 1.5,
    r: 2.5,
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
            isHorizontal
              ? Plot.boxX(data, boxOptions)
              : Plot.boxY(data, boxOptions),
          ],
        }}
        dependencies={[data, direction, layout, marks]}
      />
    </WidgetFrame>
  );
};

export const WidgetApp = () => {
  const { app, isConnected, error, payload } = useWidgetPayload(
    BoxPlotWidgetPayload,
    {
      appInfo: { name: "widget-box-plot", version: "0.1.0" },
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

  return <BoxPlot {...payload} app={app} />;
};
