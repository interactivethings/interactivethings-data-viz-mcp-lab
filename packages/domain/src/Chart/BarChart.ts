import { Schema, Struct } from "effect";
import {
  Channel,
  IntervalValue,
  NumberGreaterThanZero,
  PlotLayoutProps,
} from "./shared";

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
      "Primary position channel. For vertical bars, maps to the category/ordinal axis; for horizontal bars, maps to the value axis.",
  }),
  y: Channel.annotate({
    description:
      "Primary value channel. For vertical bars, maps to the value axis; for horizontal bars, maps to the category/ordinal axis.",
  }),
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
  stroke: Channel.annotate({
    description: "Stroke color channel. Maps to the outline color of the bars.",
  }),
  tip: Schema.Boolean.annotate({
    description: "If true, show a tooltip with all data fields on hover.",
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
      "Mark channel mapping. Use marks.x and marks.y to select data keys that match your data objects. For vertical bars, set x=category and y=value. For horizontal bars, set x=value and y=category.",
  }),
}).annotate({
  description:
    "Payload for render_bar_chart_widget. Align marks.x/marks.y with the data keys for the chosen orientation.",
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
        { breed: "Golden Retriever", popularity: 9 },
        { breed: "Labrador Retriever", popularity: 8.5 },
      ],
      direction: "horizontal",
      marks: { x: "popularity", y: "breed" },
    },
  ],
});
