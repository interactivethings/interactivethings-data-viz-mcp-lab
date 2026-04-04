import { Schema, Struct } from "effect";

export const ChannelString = Schema.String.annotate({ plotChannel: "field" });
export const ChannelNumber = Schema.Number.annotate({ plotChannel: "value" });
export const Channel = Schema.Union([ChannelString, ChannelNumber]);
export const RangeInterval = Schema.Union([
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

export const IntervalValue = RangeInterval.annotate({
  plotChannel: "interval",
});
export const AxisTickValue = Schema.Union([
  Schema.Number,
  Schema.String,
  Schema.Date,
]);
export const AxisTicks = Schema.Union([
  Schema.Number,
  Schema.String,
  Schema.Array(AxisTickValue),
]);
export const ScaleDomain = Schema.Array(AxisTickValue);
export const ScaleType = Schema.Union([
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

export const LineCurve = Schema.Literals([
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

export const LineMarker = Schema.Literals([
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

export const DotSymbol = Schema.Literals([
  "circle",
  "cross",
  "diamond",
  "square",
  "star",
  "triangle",
  "wye",
  "plus",
  "times",
  "triangle2",
  "asterisk",
  "square2",
  "diamond2",
  "hexagon",
]);

export const NumberGreaterThanZero = Schema.Union([
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
    label: Schema.Union([Schema.String, Schema.Null]),
    interval: IntervalValue,
  }).mapFields(Struct.map(Schema.optionalKey)),
  y: Schema.Struct({
    type: ScaleType,
    domain: ScaleDomain,
    ticks: AxisTicks,
    tickFormat: Schema.Union([Schema.String, Schema.Null]),
    label: Schema.Union([Schema.String, Schema.Null]),
    interval: IntervalValue,
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

export const AxisMarkProps = Schema.Struct({
  x: Channel,
  y: Channel,

  anchor: Schema.Literals(["top", "right", "bottom", "left"]),
  ticks: AxisTicks,
  tickFormat: Schema.Union([Schema.String, Schema.Unknown, Schema.Null]),
  tickRotate: Schema.Number,
  label: Schema.Union([Schema.String, Schema.Null]),
  labelAnchor: Schema.Literals(["top", "right", "bottom", "left", "center"]),
}).mapFields(Struct.map(Schema.optionalKey));
