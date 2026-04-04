import { Schema, Struct } from "effect";
import { Channel, PlotLayoutProps, RangeInterval } from "./shared";

export const AreaDatumValue = Schema.Union([
  Schema.String,
  Schema.Number,
  Schema.NumberFromString,
  Schema.Boolean,
  Schema.Date,
  Schema.Null,
]);

export const AreaDatum = Schema.Record(Schema.String, AreaDatumValue).annotate({
  description:
    "Single area-chart data object. Keys are column names used by marks.x and marks.y. Default channels expect keys 'x' (temporal/quantitative) and 'y' (quantitative). If you use different keys, set marks.x and marks.y to those key names.",
  examples: [
    { x: "2024-01-01", y: 120 },
    { date: "2024-01-01", value: 48, series: "Alpha" },
  ],
});

export const AreaDatumDefaults = Schema.Struct({
  x: Schema.Union([Schema.String, Schema.Number, Schema.Date]),
  y: Schema.Union([Schema.Number, Schema.NumberFromString]),
}).mapFields(Struct.map(Schema.optionalKey));

export const AreaVariant = Schema.Literals(["area", "area-line"]);

export const AreaMarkProps = Schema.Struct({
  x: Channel.annotate({
    description:
      "Horizontal position channel. For area charts, typically temporal or quantitative. Defaults to 'x' when omitted.",
  }),
  y: Channel.annotate({
    description:
      "Vertical value channel for Plot.areaY and Plot.lineY. Defaults to 'y' when omitted.",
  }),
  series: Channel.annotate({
    description:
      "Optional categorical field for multiple series. The renderer uses this for grouping, color, and stacked area layers.",
  }),
  interval: RangeInterval.annotate({
    description:
      "Optional interval for regularizing sampled data, especially time series.",
  }),
  sort: Schema.Union([
    Schema.String,
    Schema.Struct({
      channel: Schema.String,
      order: Schema.Literals(["ascending", "descending"]),
    }),
  ]).annotate({
    description:
      "Sort option to order points or series. Use a channel name or { channel, order }.",
  }),
  variant: AreaVariant.annotate({
    description:
      "Whether to render only the filled area or the area with an outline line. Defaults to 'area-line'. When marks.series is set, the renderer suppresses the outline and shows stacked areas only.",
  }),
}).mapFields(Struct.map(Schema.optionalKey));

export const AreaChartWidgetPayload = Schema.Struct({
  data: Schema.Array(AreaDatum).annotate({
    description:
      "Array of area-chart data objects. Each object must expose the keys used in marks.x and marks.y.",
  }),
  layout: PlotLayoutProps.annotate({
    description:
      "Plot layout options. All fields optional; omit to use defaults.",
  }).pipe(Schema.optionalKey),
  marks: AreaMarkProps.annotate({
    description:
      "Area mark channel mapping. Use marks.x and marks.y to select data keys. Defaults are x='x' and y='y' if omitted.",
  }).pipe(Schema.optionalKey),
}).annotate({
  description:
    "Payload for render_area_chart_widget. Use for trends with filled context or stacked composition over time.",
  examples: [
    {
      data: [
        { date: "2024-01-01", value: 120 },
        { date: "2024-02-01", value: 98 },
      ],
      marks: { x: "date", y: "value", variant: "area-line" },
    },
    {
      data: [
        { date: "2024-01-01", unemployed: 120, industry: "Retail" },
        { date: "2024-02-01", unemployed: 98, industry: "Retail" },
      ],
      marks: { x: "date", y: "unemployed", series: "industry" },
    },
  ],
});
