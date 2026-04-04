import * as Plot from "@observablehq/plot";
import { BulletChartWidgetPayload } from "@repo/domain/Chart";
import {
  type HostApp,
  PlotFigure,
  useWidgetPayload,
  useWidgetResize,
  WidgetFrame,
  WidgetStatus,
} from "@repo/ui";

const BulletChart = ({
  data,
  layout,
  marks,
  app,
}: typeof BulletChartWidgetPayload.Type & { app?: HostApp | null }) => {
  const { frameRef, measuredWidth } = useWidgetResize(app);

  const width = layout?.width ?? measuredWidth ?? undefined;
  const layoutOptions = layout ?? {};
  const { width: _layoutWidth, ...restLayoutOptions } = layoutOptions;
  const x = marks?.x ?? "value";
  const y = marks?.y ?? "label";
  const target = marks?.target ?? "target";

  return (
    <WidgetFrame frameRef={frameRef}>
      <PlotFigure
        options={{
          ...restLayoutOptions,
          ...(width ? { width } : {}),
          color: {
            ...(layoutOptions.color ? layoutOptions.color : {}),
            scheme: "Blues",
          },
          y: {
            ...(layoutOptions.y ? layoutOptions.y : {}),
            padding: 0.35,
          },
          marks: [
            Plot.barX(data, {
              x,
              y,
              inset: 0.5,
              title: (d) => {
                const row = d as Record<string, unknown>;
                return `${String(row[y] ?? "")}: ${String(row[x] ?? "")}`;
              },
            }),
            Plot.ruleX(data, {
              x: target,
              y,
              inset: 6,
              stroke: "currentColor",
              strokeWidth: 2,
            }),
          ],
        }}
        dependencies={[data, layout, marks]}
      />
    </WidgetFrame>
  );
};

export const WidgetApp = () => {
  const { app, isConnected, error, payload } = useWidgetPayload(
    BulletChartWidgetPayload,
    {
      appInfo: { name: "widget-bullet-chart", version: "0.1.0" },
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

  return <BulletChart {...payload} app={app} />;
};
