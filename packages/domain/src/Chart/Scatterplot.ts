import { Schema, Struct } from "effect";
import { Channel, PlotLayoutProps } from "./shared";

export const DotDatumValue = Schema.Union([
  Schema.String,
  Schema.Number,
  Schema.NumberFromString,
  Schema.Boolean,
  Schema.Date,
  Schema.Null,
]);

export const DotDatum = Schema.Record(Schema.String, DotDatumValue).annotate({
  description:
    "Single dot data object. Keys are column names used by marks.x and marks.y. Default channels expect keys 'x' (quantitative/temporal) and 'y' (quantitative). If you use different keys, set marks.x and marks.y to those key names. For time series, prefer Date objects or epoch milliseconds; if using date strings, set layout.x.type to 'utc' or 'time'.",
  examples: [
    { x: 10, y: 22 },
    { date: "2024-01-01", value: 48, category: "Alpha" },
  ],
});

export const DotDatumDefaults = Schema.Struct({
  x: Schema.Union([Schema.String, Schema.Number, Schema.Date]),
  y: Schema.Union([Schema.Number, Schema.NumberFromString]),
}).mapFields(Struct.map(Schema.optionalKey));

export const DotMarkProps = Schema.Struct({
  x: Channel.annotate({
    description: "Horizontal position field. Defaults to 'x' when omitted.",
  }),
  y: Channel.annotate({
    description: "Vertical position field. Defaults to 'y' when omitted.",
  }),
  series: Channel.annotate({
    description: "Optional categorical field for grouped color encoding.",
  }),
  size: Schema.Union([Channel, Schema.NumberFromString]).annotate({
    description:
      "Optional quantitative field for dot size, or a constant radius in pixels.",
  }),
  sort: Schema.Union([
    Schema.String,
    Schema.Null,
    Schema.Struct({
      channel: Schema.String,
      order: Schema.Literals(["ascending", "descending"]),
    }),
  ]).annotate({
    description:
      "Sort option to order dots. Use a channel name, { channel, order }, or null for input order.",
  }),
}).mapFields(Struct.map(Schema.optionalKey));

export const ScatterplotWidgetPayload = Schema.Struct({
  data: Schema.Array(DotDatum).annotate({
    description:
      "Array of dot data objects. Each object must expose the keys used in marks.x and marks.y.",
  }),
  layout: PlotLayoutProps.annotate({
    description:
      "Plot layout options. All fields optional; omit to use defaults.",
  }).pipe(Schema.optionalKey),
  marks: DotMarkProps.annotate({
    description:
      "Scatterplot mapping. Use marks.x and marks.y to select data keys. Use marks.series for grouped color and marks.size for bubble charts. Defaults are x='x' and y='y' if omitted.",
  }).pipe(Schema.optionalKey),
}).annotate({
  description:
    "Payload for render_scatterplot_widget. Use for correlation, clustering, and bubble-chart style comparisons.",
  examples: [
    {
      data: [
        { horsepower: 130, mpg: 24 },
        { horsepower: 165, mpg: 18 },
      ],
      marks: { x: "mpg", y: "horsepower" },
    },
    {
      data: [
        { x: 10, y: 22, category: "A", volume: 100 },
        { x: 15, y: 18, category: "B", volume: 160 },
      ],
      marks: { x: "x", y: "y", series: "category", size: "volume" },
    },
  ],
});
