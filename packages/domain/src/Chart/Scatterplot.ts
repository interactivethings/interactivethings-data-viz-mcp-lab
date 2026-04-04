import { Schema, Struct } from "effect";
import { Channel, DotSymbol, PlotLayoutProps } from "./shared";

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
    description:
      "Horizontal position channel. For scatterplots, typically quantitative or temporal.",
  }),
  y: Channel.annotate({
    description:
      "Vertical position channel. For scatterplots, typically quantitative.",
  }),

  r: Schema.Union([Channel, Schema.NumberFromString]).annotate({
    description: "Dot radius in pixels, or a channel name for per-point size.",
  }),
  symbol: Schema.Union([Channel, DotSymbol]).annotate({
    description:
      "Symbol name or channel. Use a categorical field to map different symbols.",
  }),
  rotate: Schema.Union([Channel, Schema.NumberFromString]).annotate({
    description: "Rotation angle in degrees clockwise, or a channel name.",
  }),

  fill: Channel.annotate({
    description: "Fill color channel. Maps to dot fill color.",
  }),
  fillOpacity: Schema.Union([Channel, Schema.NumberFromString]).annotate({
    description: "Fill opacity (0-1), or a channel name.",
  }),
  stroke: Channel.annotate({
    description: "Stroke color channel. Maps to dot outline color.",
  }),
  strokeWidth: Schema.Union([Channel, Schema.NumberFromString]).annotate({
    description: "Stroke width in pixels, or a channel name.",
  }),
  strokeOpacity: Schema.Union([Channel, Schema.NumberFromString]).annotate({
    description: "Stroke opacity (0-1), or a channel name.",
  }),
  opacity: Schema.Union([Channel, Schema.NumberFromString]).annotate({
    description: "Overall opacity (0-1), or a channel name.",
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

  tip: Schema.Boolean.annotate({
    description: "If true, show a tooltip with all data fields on hover.",
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
      "Dot mark channel mapping. Use marks.x and marks.y to select data keys. Defaults are x='x' and y='y' if omitted.",
  }),
}).annotate({
  description:
    "Payload for render_scatterplot_widget. LLM guidance: choose marks.x and marks.y to match keys in data objects.",
});
