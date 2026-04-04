import { Schema, Struct } from "effect";
import { Channel, PlotLayoutProps } from "./shared";

export const BoxPlotDatumValue = Schema.Union([
  Schema.String,
  Schema.Number,
  Schema.NumberFromString,
  Schema.Boolean,
  Schema.Date,
  Schema.Null,
]);

export const BoxPlotDatum = Schema.Record(
  Schema.String,
  BoxPlotDatumValue,
).annotate({
  description:
    "Single box-plot data object. Provide raw observations rather than summary statistics. Keys are column names used by marks.group and marks.value.",
  examples: [
    { category: "A", value: 12 },
    { group: "Control", score: 82 },
  ],
});

export const BoxPlotDatumDefaults = Schema.Struct({
  category: Schema.String,
  value: Schema.Union([Schema.Number, Schema.NumberFromString]),
}).mapFields(Struct.map(Schema.optionalKey));

export const BoxPlotMarkProps = Schema.Struct({
  group: Channel.annotate({
    description:
      "Categorical grouping field for each distribution. Defaults to 'category' when omitted.",
  }),
  value: Channel.annotate({
    description:
      "Quantitative field containing raw observations. Defaults to 'value' when omitted.",
  }),
}).mapFields(Struct.map(Schema.optionalKey));

export const BoxPlotWidgetPayload = Schema.Struct({
  data: Schema.Array(BoxPlotDatum).annotate({
    description:
      "Array of raw observation objects. Each object must expose the keys used in marks.x and marks.y.",
  }),
  direction: Schema.Literals(["horizontal", "vertical"])
    .annotate({
      description:
        "Orientation of the box plot. Vertical means x=category and y=value; horizontal means x=value and y=category.",
    })
    .pipe(Schema.optionalKey),
  layout: PlotLayoutProps.annotate({
    description:
      "Plot layout options. All fields optional; omit to use defaults.",
  }).pipe(Schema.optionalKey),
  marks: BoxPlotMarkProps.annotate({
    description:
      "Box-plot field mapping. Use marks.group for the categorical grouping dimension and marks.value for the raw observations. Defaults are group='category' and value='value' if omitted.",
  }).pipe(Schema.optionalKey),
}).annotate({
  description:
    "Payload for render_box_plot_widget. Provide raw observations and let the widget compute quartiles, whiskers, and outliers.",
  examples: [
    {
      data: [
        { category: "A", value: 10 },
        { category: "A", value: 12 },
        { category: "B", value: 18 },
      ],
      direction: "vertical",
      marks: { group: "category", value: "value" },
    },
    {
      data: [
        { team: "Alpha", score: 82 },
        { team: "Alpha", score: 79 },
        { team: "Beta", score: 88 },
      ],
      direction: "horizontal",
      marks: { group: "team", value: "score" },
    },
  ],
});
