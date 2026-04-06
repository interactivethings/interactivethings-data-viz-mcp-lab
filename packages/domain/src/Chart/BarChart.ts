import { Schema, Struct } from "effect";
import { Channel, IntervalValue, PlotLayoutProps } from "./shared";

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

export const BarMarkProps = Schema.Struct({
  x: Channel.annotate({
    description:
      "Field for the category or value axis. Defaults to 'category' for vertical bars and 'value' for horizontal bars.",
  }),
  y: Channel.annotate({
    description:
      "Field for the value or category axis. Defaults to 'value' for vertical bars and 'category' for horizontal bars.",
  }),
  series: Channel.annotate({
    description:
      "Optional categorical field for stacked bars or grouped color encoding.",
  }),
  interval: IntervalValue,
  sort: Schema.Union([
    Schema.String,
    Schema.Struct({
      channel: Schema.String,
      order: Schema.Literals(["ascending", "descending"]),
    }),
  ]).annotate({
    description:
      "Optional sort for category ordering. Use a channel name or { channel, order }.",
  }),
}).mapFields(Struct.map(Schema.optionalKey));

export const BarChartWidgetPayload = Schema.Struct({
  data: Schema.Array(BarDatum).annotate({
    description:
      "Array of bar data objects. Each object must expose the keys used in marks.x and marks.y.",
  }),
  direction: Schema.Literals(["horizontal", "vertical"])
    .annotate({
      description:
        "Orientation of bars. Vertical means x=category and y=value; horizontal means x=value and y=category.",
    })
    .pipe(Schema.optionalKey),
  layout: PlotLayoutProps.annotate({
    description:
      "Plot layout options. All fields optional; omit to use defaults.",
  }).pipe(Schema.optionalKey),
  marks: BarMarkProps.annotate({
    description:
      "Bar mark mapping. Use marks.x and marks.y to select data keys. Use marks.series for stacked bars. Defaults are based on direction if omitted.",
  }).pipe(Schema.optionalKey),
}).annotate({
  description:
    "Payload for render_bar_chart_widget. Use for category comparison, ranking, and simple part-to-whole bars.",
  examples: [
    {
      data: [
        { category: "Q1", value: 120 },
        { category: "Q2", value: 98 },
      ],
      direction: "vertical",
      marks: { x: "category", y: "value" },
    },
    {
      data: [
        { quarter: "Q1", region: "EU", value: 40 },
        { quarter: "Q1", region: "NA", value: 80 },
        { quarter: "Q2", region: "EU", value: 30 },
        { quarter: "Q2", region: "NA", value: 68 },
      ],
      direction: "vertical",
      marks: { x: "quarter", y: "value", series: "region" },
    },
  ],
});
