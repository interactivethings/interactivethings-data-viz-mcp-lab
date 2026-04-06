import { Schema, Struct } from "effect";
import { Channel, PlotLayoutProps } from "./shared";

export const LineDatumValue = Schema.Union([
  Schema.String,
  Schema.Number,
  Schema.NumberFromString,
  Schema.Boolean,
  Schema.Date,
  Schema.Null,
]);

export const LineDatum = Schema.Record(Schema.String, LineDatumValue).annotate({
  description:
    "Single line data object. Keys are column names used by marks.x and marks.y. Default channels expect keys 'x' (temporal/quantitative) and 'y' (quantitative). If you use different keys, set marks.x and marks.y to those key names. For time series, prefer Date objects or epoch milliseconds; if using date strings, set layout.x.type to 'utc' or 'time'.",
  examples: [
    { x: "2024-01-01", y: 120 },
    { date: "2024-01-01", value: 48, series: "Alpha" },
  ],
});

export const LineDatumDefaults = Schema.Struct({
  x: Schema.Union([Schema.String, Schema.Number, Schema.Date]),
  y: Schema.Union([Schema.Number, Schema.NumberFromString]),
}).mapFields(Struct.map(Schema.optionalKey));

export const LineMarkProps = Schema.Struct({
  x: Channel.annotate({
    description: "Horizontal position field. Defaults to 'x' when omitted.",
  }),
  y: Channel.annotate({
    description: "Vertical value field. Defaults to 'y' when omitted.",
  }),
  series: Channel.annotate({
    description:
      "Optional categorical field for multiple series. The renderer uses this for grouping and color.",
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
}).mapFields(Struct.map(Schema.optionalKey));

export const LineChartWidgetPayload = Schema.Struct({
  data: Schema.Array(LineDatum).annotate({
    description:
      "Array of line data objects. Each object must expose the keys used in marks.x and marks.y.",
  }),
  layout: PlotLayoutProps.annotate({
    description:
      "Plot layout options. All fields optional; omit to use defaults.",
  }).pipe(Schema.optionalKey),
  marks: LineMarkProps.annotate({
    description:
      "Line mark mapping. Use marks.x and marks.y to select data keys. Use marks.series for multiple lines. Defaults are x='x' and y='y' if omitted.",
  }).pipe(Schema.optionalKey),
}).annotate({
  description:
    "Payload for render_line_chart_widget. Use for trends and continuous comparisons across time or another ordered dimension.",
  examples: [
    {
      data: [
        { date: "2024-01-01", value: 120 },
        { date: "2024-02-01", value: 98 },
      ],
      marks: { x: "date", y: "value" },
    },
    {
      data: [
        { date: "2024-01-01", value: 120, series: "Alpha" },
        { date: "2024-02-01", value: 98, series: "Alpha" },
        { date: "2024-01-01", value: 80, series: "Beta" },
        { date: "2024-02-01", value: 110, series: "Beta" },
      ],
      marks: { x: "date", y: "value", series: "series" },
    },
  ],
});
