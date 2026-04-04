import { Schema, Struct } from "effect";
import { ChannelString, PlotLayoutProps } from "./shared";

export const HeatmapDatumValue = Schema.Union([
  Schema.String,
  Schema.Number,
  Schema.NumberFromString,
  Schema.Boolean,
  Schema.Date,
  Schema.Null,
]);

export const HeatmapDatum = Schema.Record(
  Schema.String,
  HeatmapDatumValue,
).annotate({
  description:
    "Single heatmap cell data object. Keys are column names used by marks.x, marks.y, and marks.value. For matrix heatmaps, x and y should usually be ordinal categories while value should be quantitative.",
  examples: [
    { x: "Jan", y: "North", value: 42 },
    { season: "S1", episode: "E1", rating: 8.7 },
  ],
});

export const HeatmapDatumDefaults = Schema.Struct({
  x: Schema.String,
  y: Schema.String,
  value: Schema.Union([Schema.Number, Schema.NumberFromString]),
}).mapFields(Struct.map(Schema.optionalKey));

export const HeatmapMarkProps = Schema.Struct({
  x: ChannelString.annotate({
    description:
      "Ordinal x-axis channel for the heatmap matrix, such as month, season, or category.",
  }),
  y: ChannelString.annotate({
    description:
      "Ordinal y-axis channel for the heatmap matrix, such as region, episode, or category.",
  }),
  value: ChannelString.annotate({
    description:
      "Quantitative value field used to color each cell, such as score, count, or correlation.",
  }),
}).mapFields(Struct.map(Schema.optionalKey));

export const HeatmapWidgetPayload = Schema.Struct({
  data: Schema.Array(HeatmapDatum).annotate({
    description:
      "Array of matrix cell objects. Each object must expose the keys used in marks.x, marks.y, and marks.value.",
  }),
  layout: PlotLayoutProps.annotate({
    description:
      "Plot layout options. All fields optional; omit to use defaults.",
  }).pipe(Schema.optionalKey),
  marks: HeatmapMarkProps.annotate({
    description:
      "Heatmap mapping. Use marks.x and marks.y for matrix axes and marks.value for the numeric cell value.",
  }).pipe(Schema.optionalKey),
}).annotate({
  description:
    "Payload for render_heatmap_widget. Use for matrix-style heatmaps where each row represents a single cell value.",
  examples: [
    {
      data: [
        { month: "Jan", region: "North", sales: 42 },
        { month: "Jan", region: "South", sales: 31 },
      ],
      marks: { x: "month", y: "region", value: "sales" },
    },
    {
      data: [
        { season: "S1", episode: "E1", rating: 8.7 },
        { season: "S1", episode: "E2", rating: 7.9 },
      ],
      marks: { x: "season", y: "episode", value: "rating" },
    },
  ],
});
