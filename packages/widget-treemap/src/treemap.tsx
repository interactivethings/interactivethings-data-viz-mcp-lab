import * as Plot from "@observablehq/plot";
import { TreemapWidgetPayload } from "@repo/domain/Chart";
import {
  type HostApp,
  PlotFigure,
  useWidgetPayload,
  useWidgetResize,
  WidgetFrame,
  WidgetStatus,
} from "@repo/ui";
import { hierarchy, treemap } from "d3";

type TreemapNode = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  label: string;
  value: number;
  series: unknown;
  title: string;
};

type TreemapItem = {
  label: string;
  value: number;
  series: unknown;
  title: string;
};

type TreemapHierarchyDatum = {
  children?: Array<TreemapItem>;
  label?: string;
  value?: number;
  series?: unknown;
  title?: string;
};

const TreemapChart = ({
  data,
  layout,
  marks,
  app,
}: typeof TreemapWidgetPayload.Type & { app?: HostApp | null }) => {
  const { frameRef, measuredWidth } = useWidgetResize(app);

  const width = layout?.width ?? measuredWidth ?? undefined;
  const layoutOptions = layout ?? {};
  const {
    width: _layoutWidth,
    height: layoutHeight,
    ...restLayoutOptions
  } = layoutOptions;
  const plotWidth = width ?? 640;
  const plotHeight = layoutHeight ?? 420;
  const labelField = marks?.label ?? "category";
  const valueField = marks?.value ?? "value";
  const seriesField = marks?.series ?? labelField;
  const tilePadding = 1;

  const items: Array<TreemapItem> = data
    .map((row: (typeof data)[number]) => {
      const label = row[labelField as keyof typeof row];
      const value = row[valueField as keyof typeof row];
      const series = row[seriesField as keyof typeof row];
      const labelText = label == null ? "" : String(label);
      const numericValue =
        typeof value === "number" ? value : Number(value == null ? NaN : value);

      const titleLines = [`${labelText}: ${numericValue}`];

      if (marks?.series && series != null) {
        titleLines.push(`${marks.series}: ${String(series)}`);
      }

      return {
        label: labelText,
        value: numericValue,
        series,
        title: titleLines.join("\n"),
      };
    })
    .filter((row: TreemapItem) => Number.isFinite(row.value) && row.value > 0);

  const root = hierarchy<TreemapHierarchyDatum>({ children: items }).sum(
    (d) => d.value ?? 0,
  );

  const treemapRoot = treemap<TreemapHierarchyDatum>()
    .size([plotWidth, plotHeight])
    .paddingInner(tilePadding)(root);

  const leaves = treemapRoot.leaves();
  const nodes: Array<TreemapNode> = leaves.map((leaf) => ({
    x0: leaf.x0,
    y0: leaf.y0,
    x1: leaf.x1,
    y1: leaf.y1,
    label: leaf.data.label ?? "",
    value: leaf.data.value ?? 0,
    series: leaf.data.series,
    title:
      leaf.data.title ?? `${leaf.data.label ?? ""}: ${leaf.data.value ?? 0}`,
  }));

  const labelNodes = nodes.filter(
    (node) => node.x1 - node.x0 >= 72 && node.y1 - node.y0 >= 28,
  );

  return (
    <WidgetFrame frameRef={frameRef}>
      <PlotFigure
        options={{
          ...restLayoutOptions,
          width: plotWidth,
          height: plotHeight,
          axis: null,
          margin: 0,
          x: { axis: null, label: null },
          y: { axis: null, label: null },
          color: {
            ...(layoutOptions.color ? layoutOptions.color : {}),
            scheme: "Category10",
          },
          marks: [
            Plot.rect(nodes, {
              x1: "x0",
              y1: "y0",
              x2: "x1",
              y2: "y1",
              fill: (d: TreemapNode) => d.series,
              stroke: "white",
              strokeOpacity: 0.9,
              strokeWidth: 1,
              inset: 1,
              r: 6,
              title: (d: TreemapNode) => d.title,
            }),
            labelNodes.length > 0
              ? Plot.text(labelNodes, {
                  x: (d: TreemapNode) => (d.x0 + d.x1) / 2,
                  y: (d: TreemapNode) => (d.y0 + d.y1) / 2,
                  text: (d: TreemapNode) => d.label,
                  fill: "white",
                  textAnchor: "middle",
                  lineAnchor: "middle",
                  fontSize: 12,
                  fontWeight: 600,
                  pointerEvents: "none",
                })
              : null,
          ].filter(Boolean),
        }}
        dependencies={[data, layout, marks]}
      />
    </WidgetFrame>
  );
};

export const WidgetApp = () => {
  const { app, isConnected, error, payload } = useWidgetPayload(
    TreemapWidgetPayload,
    {
      appInfo: { name: "widget-treemap", version: "0.1.0" },
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

  return <TreemapChart {...payload} app={app} />;
};
