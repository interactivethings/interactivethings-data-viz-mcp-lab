import * as Plot from "@observablehq/plot";
import { GeoChartWidgetPayload } from "@repo/domain/Chart";
import {
  type HostApp,
  PlotFigure,
  useWidgetPayload,
  useWidgetResize,
  WidgetFrame,
  WidgetStatus,
} from "@repo/ui";
import type { Feature, Geometry } from "geojson";
import { countries, land } from "./geo-data";

const projectionDefaults = "equal-earth";

type GeoMark = (typeof GeoChartWidgetPayload.Type.marks)[number];
type GeoRow = (typeof GeoChartWidgetPayload.Type.data)[number];
type GeoRowRecord = Record<string, unknown>;
type GeoFeatureWithProperties = Feature<Geometry, GeoRowRecord>;

const asRecord = (value: unknown): GeoRowRecord =>
  value && typeof value === "object" ? (value as GeoRowRecord) : {};

const getFieldValue = (row: GeoRowRecord, key: string) => row[key];

const toProjectionRotate = (
  rotate: readonly [number, number] | readonly [number, number, number],
): [number, number] | [number, number, number] =>
  rotate.length === 2
    ? [rotate[0], rotate[1]]
    : [rotate[0], rotate[1], rotate[2]];

const getChannelValue = (row: GeoRowRecord, channel: unknown) => {
  if (typeof channel === "number") {
    return channel;
  }
  if (typeof channel === "string") {
    return channel in row ? row[channel] : channel;
  }
  return undefined;
};

const plotProjection =
  typeof projectionDefaults === "string" ? projectionDefaults : undefined;

const GeoChart = ({
  data,
  layout,
  projection,
  marks,
  app,
}: typeof GeoChartWidgetPayload.Type & { app?: HostApp | null }) => {
  const { frameRef, measuredWidth } = useWidgetResize(app);

  const width = layout?.width ?? measuredWidth ?? undefined;
  const layoutOptions = layout ?? {};
  const { width: _layoutWidth, ...restLayoutOptions } = layoutOptions;
  const normalizedProjection =
    typeof projection === "string" || projection == null
      ? (projection ?? projectionDefaults)
      : {
          ...(projection.type ? { type: projection.type } : {}),
          ...(projection.inset ? { inset: projection.inset } : {}),
          ...(projection.clip !== undefined ? { clip: projection.clip } : {}),
          ...(projection.rotate
            ? {
                rotate: toProjectionRotate(projection.rotate),
              }
            : {}),
        };

  const renderedMarks = marks
    .map((mark: GeoMark) => {
      switch (mark._tag) {
        case "land":
          return Plot.geo(land, {
            fill: "#e5e7eb",
            stroke: "#ffffff",
            strokeWidth: 0.75,
          });
        case "sphere":
          return Plot.sphere({
            stroke: "#94a3b8",
            strokeWidth: 1,
          });
        case "graticule":
          return Plot.graticule({
            strokeOpacity: 0.2,
          });
        case "point":
          return Plot.dot(data, {
            x: mark.longitude ?? "longitude",
            y: mark.latitude ?? "latitude",
            ...(mark.size ? { r: mark.size } : { r: 4 }),
            ...(mark.series ? { fill: mark.series, stroke: mark.series } : {}),
            ...(mark.title ? { title: mark.title } : {}),
            ...(mark.sort !== undefined ? { sort: mark.sort } : {}),
            fillOpacity: 0.35,
            strokeWidth: 1,
            tip: true,
          });
        case "choropleth": {
          const keyField = mark.dataKey ?? "id";
          const featureField = mark.featureKey ?? "id";
          const rowsByKey = new Map<string, GeoRow>();

          for (const row of data) {
            const key = getFieldValue(asRecord(row), keyField);
            if (key != null) {
              rowsByKey.set(String(key), row);
            }
          }

          const features: GeoFeatureWithProperties[] = countries.features.map(
            (country) => {
              const featureKey =
                featureField === "name"
                  ? country.properties?.["name"]
                  : country.id;
              const row =
                featureKey == null
                  ? undefined
                  : rowsByKey.get(String(featureKey));

              return {
                ...country,
                properties: {
                  ...asRecord(country.properties),
                  ...asRecord(row),
                },
              };
            },
          );

          return Plot.geo(features, {
            fill: (d) =>
              getChannelValue(asRecord(d.properties), mark.value ?? "value"),
            stroke: "#ffffff",
            strokeWidth: 0.75,
            ...(mark.title
              ? {
                  title: (d) =>
                    getChannelValue(asRecord(d.properties), mark.title),
                }
              : {
                  title: (d) => {
                    const properties = asRecord(d.properties);
                    const name =
                      typeof properties["name"] === "string"
                        ? properties["name"]
                        : String(d.id ?? "Unknown");
                    const fillValue = getChannelValue(properties, mark.value);
                    return fillValue == null ? name : `${name}: ${fillValue}`;
                  },
                }),
            tip: true,
          });
        }
        default:
          return null;
      }
    })
    .filter(Boolean);

  const defaultColorScheme = marks.some(
    (mark: GeoMark) => mark._tag === "choropleth",
  )
    ? "Blues"
    : "Category10";

  return (
    <WidgetFrame frameRef={frameRef}>
      <PlotFigure
        options={{
          ...restLayoutOptions,
          ...(width ? { width } : {}),
          projection: normalizedProjection ?? plotProjection,
          color: {
            ...(layoutOptions.color ? layoutOptions.color : {}),
            scheme: defaultColorScheme,
          },
          marks: renderedMarks,
        }}
        dependencies={[data, layout, projection, marks]}
      />
    </WidgetFrame>
  );
};

export const WidgetApp = () => {
  const { app, isConnected, error, payload } = useWidgetPayload(
    GeoChartWidgetPayload,
    {
      appInfo: { name: "widget-geo-chart", version: "0.1.0" },
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

  return <GeoChart {...payload} app={app} />;
};
