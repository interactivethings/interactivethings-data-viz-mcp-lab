import { Schema, Struct } from "effect";
import { Channel, LineCurve, LineMarker, PlotLayoutProps } from "./shared";

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
    description:
      "Horizontal position channel. For line charts, typically temporal or quantitative.",
  }),
  y: Channel.annotate({
    description:
      "Vertical position channel. For line charts, typically quantitative.",
  }),
  z: Channel.annotate({
    description:
      "Series/channel for grouping multiple lines. Typically a categorical value such as a series name.",
  }),

  stroke: Channel.annotate({
    description:
      "Stroke color channel. If specified, consider also setting z to avoid segmenting on color changes.",
  }),
  strokeWidth: Schema.Union([Channel, Schema.NumberFromString]).annotate({
    description:
      "Stroke width in pixels, or a channel name for per-point width.",
  }),
  strokeOpacity: Schema.Union([Channel, Schema.NumberFromString]).annotate({
    description:
      "Stroke opacity (0-1), or a channel name for per-point opacity.",
  }),

  curve: LineCurve.annotate({
    description:
      "Curve interpolation name (e.g. linear, step, basis, catmull-rom).",
  }),
  marker: Schema.Union([Schema.Boolean, LineMarker]).annotate({
    description:
      "Marker to draw at each point (true for default, or marker name).",
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

  tip: Schema.Boolean.annotate({
    description: "If true, show a tooltip with all data fields on hover.",
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
      "Line mark channel mapping. Use marks.x and marks.y to select data keys. Defaults are x='x' and y='y' if omitted.",
  }).pipe(Schema.optionalKey),
}).annotate({
  description:
    "Payload for render_line_chart_widget. LLM guidance: choose marks.x and marks.y to match keys in data objects.",
});
