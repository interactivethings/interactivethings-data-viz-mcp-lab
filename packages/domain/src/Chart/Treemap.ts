import { Schema, Struct } from "effect";
import { Channel, ChannelString, PlotLayoutProps } from "./shared";

export const TreemapDatumValue = Schema.Union([
  Schema.String,
  Schema.Number,
  Schema.NumberFromString,
  Schema.Boolean,
  Schema.Date,
  Schema.Null,
]);

export const TreemapDatum = Schema.Record(
  Schema.String,
  TreemapDatumValue,
).annotate({
  description:
    "Single treemap data object for a flat, single-level treemap. Keys are column names used by marks.label, marks.value, and optional marks.series. Each row represents one category rectangle.",
  examples: [
    { category: "Retail", value: 120 },
    { name: "Alpha", amount: 48, portfolio: "Core" },
  ],
});

export const TreemapDatumDefaults = Schema.Struct({
  category: Schema.String,
  value: Schema.Union([Schema.Number, Schema.NumberFromString]),
}).mapFields(Struct.map(Schema.optionalKey));

export const TreemapMarkProps = Schema.Struct({
  label: ChannelString.annotate({
    description:
      "Category label field used for treemap tiles and text labels. Defaults to 'category' when omitted.",
  }),
  value: Channel.annotate({
    description:
      "Quantitative value field used to size treemap rectangles. Defaults to 'value' when omitted.",
  }),
  series: Channel.annotate({
    description:
      "Optional categorical field used for grouping and color. When omitted, the renderer colors by the label field.",
  }),
}).mapFields(Struct.map(Schema.optionalKey));

export const TreemapWidgetPayload = Schema.Struct({
  data: Schema.Array(TreemapDatum).annotate({
    description:
      "Array of flat treemap category objects. Each object must expose the keys used in marks.label and marks.value.",
  }),
  layout: PlotLayoutProps.annotate({
    description:
      "Plot layout options. All fields optional; omit to use defaults.",
  }).pipe(Schema.optionalKey),
  marks: TreemapMarkProps.annotate({
    description:
      "Treemap field mapping. Use marks.label for category names, marks.value for numeric area sizing, and marks.series when color grouping should differ from the label.",
  }).pipe(Schema.optionalKey),
}).annotate({
  description:
    "Payload for render_treemap_widget. Use for a flat part-to-whole comparison where each row represents one category and value.",
  examples: [
    {
      data: [
        { category: "Retail", value: 120 },
        { category: "Health", value: 80 },
      ],
      marks: { label: "category", value: "value" },
    },
    {
      data: [
        { company: "Alpha", portfolio: "Core", exposure: 120 },
        { company: "Beta", portfolio: "Core", exposure: 80 },
        { company: "Gamma", portfolio: "Venture", exposure: 45 },
      ],
      marks: {
        label: "company",
        value: "exposure",
        series: "portfolio",
      },
    },
  ],
});
