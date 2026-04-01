import { Schema, Struct } from "effect";

const ChannelString = Schema.String.annotate({ plotChannel: "field" });
const ChannelNumber = Schema.Number.annotate({ plotChannel: "value" });
const Channel = Schema.Union([ChannelString, ChannelNumber]);
const IntervalValue = Schema.Union([
  Schema.Number.annotate({ plotChannel: "interval" }),
  Schema.String.annotate({ plotChannel: "interval" }),
]);
const AxisTickValue = Schema.Union([Schema.Number, Schema.String, Schema.Date]);
const AxisTicks = Schema.Union([
  Schema.Number,
  Schema.String,
  Schema.Array(AxisTickValue),
]);

export const BarDatumValue = Schema.Union([
  Schema.String,
  Schema.Number,
  Schema.NumberFromString,
  Schema.Boolean,
  Schema.Date,
  Schema.Null,
]);

export const BarDatum = Schema.Record(Schema.String, BarDatumValue).annotate({
  description:
    "Single bar data object. Keys are column names used by marks.x and marks.y. Default channels expect keys 'category' (string-ish) and 'value' (number-ish). If you use different keys, set marks.x and marks.y to those key names.",
  examples: [
    { category: "Q1", value: 120 },
    { product: "Alpha", sales: 48, region: "EU" },
  ],
});

export const BarDatumDefaults = Schema.Struct({
  category: Schema.String,
  value: Schema.Union([Schema.Number, Schema.NumberFromString]),
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
}).mapFields(Struct.map(Schema.optionalKey));

export const BarMarkProps = Schema.Struct({
  x: Channel,
  x1: Channel,
  x2: Channel,
  y: Channel,
  y1: Channel,
  y2: Channel,
  z: Channel,
  interval: IntervalValue,

  inset: NumberGreaterThanZero,

  fill: Channel,
  fillOpacity: Channel,
  stroke: Channel,
  strokeWidth: Channel,
  strokeOpacity: Channel,
  opacity: Channel,
}).mapFields(Struct.map(Schema.optionalKey));

export const AxisMarkProps = Schema.Struct({
  x: Channel,
  y: Channel,

  anchor: Schema.Literals(["top", "right", "bottom", "left"]),
  ticks: AxisTicks,
  // tickSpacing: Schema.Number,
  // interval: IntervalValue,
  // tickSize: Schema.Number,
  tickFormat: Schema.Union([Schema.String, Schema.Unknown]),
  tickRotate: Schema.Number,
  label: Schema.Union([Schema.String, Schema.Null]),
  labelAnchor: Schema.Literals(["top", "right", "bottom", "left", "center"]),
  labelOffset: Schema.Number,
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
