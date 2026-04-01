import { Schema, Struct } from "effect";

const ChannelString = Schema.String.annotate({ plotChannel: "field" });
const ChannelNumber = Schema.Number.annotate({ plotChannel: "value" });
const Channel = Schema.Union([ChannelString, ChannelNumber]);
const RangeInterval = Schema.Union([
  Schema.Number,
  Schema.Literals([
    "second",
    "minute",
    "hour",
    "day",
    "week",
    "month",
    "quarter",
    "half",
    "year",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ]),
]);

const IntervalValue = RangeInterval.annotate({ plotChannel: "interval" });
const AxisTickValue = Schema.Union([Schema.Number, Schema.String, Schema.Date]);
const AxisTicks = Schema.Union([
  Schema.Number,
  Schema.String,
  Schema.Array(AxisTickValue),
]);
const ScaleDomain = Schema.Array(AxisTickValue);
const ScaleType = Schema.Union([
  Schema.Literal("linear").annotate({
    description:
      "Default for quantitative values (counts, measurements). Avoid for years if you want calendar ticks.",
  }),
  Schema.Literal("log").annotate({
    description: "Use for values spanning orders of magnitude (must be > 0).",
  }),
  Schema.Literal("symlog").annotate({
    description: "Use for wide-range values that cross zero.",
  }),
  Schema.Literal("pow").annotate({
    description: "Use for power transforms when you need a custom exponent.",
  }),
  Schema.Literal("sqrt").annotate({
    description:
      "Use for square-root scaling (often for size/radius encodings).",
  }),
  Schema.Literal("utc").annotate({
    description:
      "Use for dates or years so ticks follow the calendar in UTC (recommended).",
  }),
  Schema.Literal("time").annotate({
    description:
      "Use for dates or years when you want local time instead of UTC.",
  }),
  Schema.Literal("point").annotate({
    description: "Use for ordinal categories shown as discrete points.",
  }),
  Schema.Literal("band").annotate({
    description: "Use for ordinal categories with width (bars, rects).",
  }),
  Schema.Literal("ordinal").annotate({
    description: "Use for ordered categories (strings, booleans).",
  }),
  Schema.Literal("categorical").annotate({
    description: "Use for unordered categories; mainly for color scales.",
  }),
  Schema.Literal("identity").annotate({
    description: "Use to bypass scaling and interpret values directly.",
  }),
]);

const LineCurve = Schema.Literals([
  "basis",
  "basis-open",
  "basis-closed",
  "bump-x",
  "bump-y",
  "bundle",
  "cardinal",
  "cardinal-open",
  "cardinal-closed",
  "catmull-rom",
  "catmull-rom-open",
  "catmull-rom-closed",
  "linear",
  "linear-closed",
  "monotone-x",
  "monotone-y",
  "natural",
  "step",
  "step-after",
  "step-before",
  "auto",
]);

const LineMarker = Schema.Literals([
  "none",
  "arrow",
  "arrow-reverse",
  "dot",
  "circle",
  "circle-stroke",
  "tick",
  "tick-x",
  "tick-y",
]);

export const BarDatumValue = Schema.Union([
  Schema.String,
  Schema.Number,
  Schema.NumberFromString,
  Schema.Boolean,
  Schema.Date,
  Schema.Null,
]);

export const LineDatumValue = Schema.Union([
  Schema.String,
  Schema.Number,
  Schema.NumberFromString,
  Schema.Boolean,
  Schema.Date,
  Schema.Null,
]);

export const BarDatum = Schema.Record(Schema.String, BarDatumValue).annotate({
  description:
    "Single bar data object. Keys are column names used by marks.x and marks.y. Default channels expect keys 'category' (string-ish) and 'value' (number-ish). If you use different keys, set marks.x and marks.y to those key names. For temporal axes, prefer Date objects or epoch milliseconds; if using date strings, set layout.x.type to 'utc' or 'time'.",
  examples: [
    { category: "Q1", value: 120 },
    { product: "Alpha", sales: 48, region: "EU" },
  ],
});

export const BarDatumDefaults = Schema.Struct({
  category: Schema.String,
  value: Schema.Union([Schema.Number, Schema.NumberFromString]),
}).mapFields(Struct.map(Schema.optionalKey));

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

const NumberGreaterThanZero = Schema.Union([
  Schema.Number,
  Schema.NumberFromString,
]).check(Schema.isGreaterThan(0));

export const PlotLayoutProps = Schema.Struct({
  title: Schema.String,
  subtitle: Schema.String,
  caption: Schema.String,

  aspectRatio: NumberGreaterThanZero,
  marginTop: NumberGreaterThanZero,
  marginRight: NumberGreaterThanZero,
  marginBottom: NumberGreaterThanZero,
  marginLeft: NumberGreaterThanZero,
  margin: NumberGreaterThanZero,
  width: NumberGreaterThanZero,
  height: NumberGreaterThanZero,

  inset: NumberGreaterThanZero,
  grid: Schema.Boolean,

  x: Schema.Struct({
    type: ScaleType,
    domain: ScaleDomain,
    ticks: AxisTicks,
    tickFormat: Schema.Union([Schema.String, Schema.Null]),
    // tickRotate: Schema.Number,
    label: Schema.Union([Schema.String, Schema.Null]),
    interval: IntervalValue,
    // grid: Schema.Boolean,
  }).mapFields(Struct.map(Schema.optionalKey)),
  y: Schema.Struct({
    type: ScaleType,
    domain: ScaleDomain,
    ticks: AxisTicks,
    tickFormat: Schema.Union([Schema.String, Schema.Null]),
    // tickRotate: Schema.Number,
    label: Schema.Union([Schema.String, Schema.Null]),
    interval: IntervalValue,
    // grid: Schema.Boolean,
  }).mapFields(Struct.map(Schema.optionalKey)),

  color: Schema.Struct({
    legend: Schema.Boolean,
  }),
}).mapFields(Struct.map(Schema.optionalKey));

PlotLayoutProps.annotate({
  description:
    "Plot layout options. For year values (even if provided as whole numbers), set layout.x.type to 'utc' or 'time' and use a time tick format such as '%Y' with ticks or interval set to 'year'.",
  examples: [
    {
      x: {
        type: "utc",
        ticks: "year",
        tickFormat: "%Y",
        interval: "year",
      },
    },
  ],
});

export const BarMarkProps = Schema.Struct({
  x: Channel.annotate({
    description:
      "Primary position channel. For vertical bars, maps to the category/ordinal axis; for horizontal bars, maps to the value axis.",
  }),
  // x1: Channel,
  // x2: Channel,
  y: Channel.annotate({
    description:
      "Primary value channel. For vertical bars, maps to the value axis; for horizontal bars, maps to the category/ordinal axis.",
  }),
  // y1: Channel,
  // y2: Channel,
  z: Channel.annotate({
    description:
      "Series/channel for grouping within each stack. Use with fill for stacked bars when multiple series share the same x/y.",
  }),
  interval: IntervalValue,

  inset: NumberGreaterThanZero,

  fill: Channel.annotate({
    description:
      "Series/color channel. With only x and y available, setting fill (or z) makes Plot apply the stack transform, producing stacked bars. Vertical bars stack by x; horizontal bars stack by y.",
  }),
  // fillOpacity: Channel,
  stroke: Channel.annotate({
    description: "Stroke color channel. Maps to the outline color of the bars.",
  }),
  // strokeWidth: Channel,
  // strokeOpacity: Channel,
  // opacity: Channel,

  tip: Schema.Boolean.annotate({
    description: "If true, show a tooltip with all data fields on hover.",
  }),
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

export const AxisMarkProps = Schema.Struct({
  x: Channel,
  y: Channel,

  anchor: Schema.Literals(["top", "right", "bottom", "left"]),
  ticks: AxisTicks,
  // tickSpacing: Schema.Number,
  // interval: IntervalValue,
  // tickSize: Schema.Number,
  tickFormat: Schema.Union([Schema.String, Schema.Unknown, Schema.Null]),
  tickRotate: Schema.Number,
  label: Schema.Union([Schema.String, Schema.Null]),
  labelAnchor: Schema.Literals(["top", "right", "bottom", "left", "center"]),
  // labelOffset: Schema.Number,
}).mapFields(Struct.map(Schema.optionalKey));

export const BarChartWidgetPayload = Schema.Struct({
  data: Schema.Array(BarDatum).annotate({
    description:
      "Array of bar data objects. Each object must expose the keys used in marks.x and marks.y.",
  }),
  direction: Schema.Literals(["horizontal", "vertical"]).annotate({
    description:
      "Orientation of bars. Vertical defaults to x=category and y=value; horizontal swaps them.",
  }),
  layout: PlotLayoutProps.annotate({
    description:
      "Plot layout options. All fields optional; omit to use defaults.",
  }),
  marks: BarMarkProps.annotate({
    description:
      "Mark channel mapping. Use marks.x and marks.y to select data keys. If omitted, defaults are x=category and y=value for vertical bars, swapped for horizontal.",
  }),
}).annotate({
  description:
    "Payload for render_bar_chart_widget. LLM guidance: choose marks.x and marks.y to match keys in data objects.",
});

export const LineChartWidgetPayload = Schema.Struct({
  data: Schema.Array(LineDatum).annotate({
    description:
      "Array of line data objects. Each object must expose the keys used in marks.x and marks.y.",
  }),
  layout: PlotLayoutProps.annotate({
    description:
      "Plot layout options. All fields optional; omit to use defaults.",
  }),
  marks: LineMarkProps.annotate({
    description:
      "Line mark channel mapping. Use marks.x and marks.y to select data keys. Defaults are x='x' and y='y' if omitted.",
  }),
}).annotate({
  description:
    "Payload for render_line_chart_widget. LLM guidance: choose marks.x and marks.y to match keys in data objects.",
});
