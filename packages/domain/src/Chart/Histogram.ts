import { Schema, Struct } from "effect";
import {
  ChannelString,
  IntervalValue,
  NumberGreaterThanZero,
  PlotLayoutProps,
} from "./shared";

export const HistogramDatumValue = Schema.Union([
  Schema.String,
  Schema.Number,
  Schema.NumberFromString,
  Schema.Boolean,
  Schema.Date,
  Schema.Null,
]);

export const HistogramDatum = Schema.Record(
  Schema.String,
  HistogramDatumValue,
).annotate({
  description:
    "Single histogram data object. Provide raw observations rather than pre-binned counts. Keys are column names used by marks.x and optional grouping fields such as marks.series.",
  examples: [{ value: 72 }, { weight: 81, sex: "female" }],
});

export const HistogramDatumDefaults = Schema.Struct({
  value: Schema.Union([Schema.Number, Schema.NumberFromString]),
}).mapFields(Struct.map(Schema.optionalKey));

export const HistogramMarkProps = Schema.Struct({
  x: ChannelString.annotate({
    description:
      "Source field to bin along the x-axis. This should reference a key in each data object, such as 'value' or 'weight'.",
  }),
  series: ChannelString.annotate({
    description:
      "Optional categorical field for grouped histograms and color encoding.",
  }),
  interval: IntervalValue.annotate({
    description:
      "Optional bin interval hint. Use calendar intervals such as 'month' for temporal histograms or a numeric step size for quantitative histograms.",
  }),
  thresholds: NumberGreaterThanZero.annotate({
    description:
      "Optional number of bins to target when interval is not specified.",
  }),
}).mapFields(Struct.map(Schema.optionalKey));

export const HistogramWidgetPayload = Schema.Struct({
  data: Schema.Array(HistogramDatum).annotate({
    description:
      "Array of raw observation objects. Each object must expose the key used in marks.x.",
  }),
  layout: PlotLayoutProps.annotate({
    description:
      "Plot layout options. All fields optional; omit to use defaults.",
  }).pipe(Schema.optionalKey),
  marks: HistogramMarkProps.annotate({
    description:
      "Histogram mapping. Use marks.x to select the field to bin. Use marks.series for grouped histograms. Defaults should assume x='value' if omitted.",
  }).pipe(Schema.optionalKey),
}).annotate({
  description:
    "Payload for a histogram widget. Provide raw observations and let the widget compute bin counts with Plot.binX.",
  examples: [
    {
      data: [{ value: 12 }, { value: 18 }, { value: 21 }, { value: 22 }],
      marks: { x: "value" },
    },
    {
      data: [
        { weight: 62, sex: "female" },
        { weight: 81, sex: "male" },
      ],
      layout: { title: "Weight distribution by sex", grid: true },
      marks: { x: "weight", series: "sex", thresholds: 12 },
    },
  ],
});
