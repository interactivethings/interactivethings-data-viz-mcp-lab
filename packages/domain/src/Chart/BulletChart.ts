import { Schema, Struct } from "effect";
import { Channel, PlotLayoutProps } from "./shared";

export const BulletDatumValue = Schema.Union([
  Schema.String,
  Schema.Number,
  Schema.NumberFromString,
  Schema.Boolean,
  Schema.Date,
  Schema.Null,
]);

export const BulletDatum = Schema.Record(
  Schema.String,
  BulletDatumValue,
).annotate({
  description:
    "Single bullet-chart row. Each row should include a category label, a primary value, and a target value.",
  examples: [
    {
      label: "Revenue",
      value: 72,
      target: 80,
    },
  ],
});

export const BulletDatumDefaults = Schema.Struct({
  label: Schema.String,
  value: Schema.Union([Schema.Number, Schema.NumberFromString]),
  target: Schema.Union([Schema.Number, Schema.NumberFromString]),
}).mapFields(Struct.map(Schema.optionalKey));

export const BulletMarkProps = Schema.Struct({
  x: Channel.annotate({
    description:
      "Primary quantitative value field for the horizontal bar. Defaults to 'value' when omitted.",
  }),
  y: Channel.annotate({
    description:
      "Categorical field for the bar rows. Defaults to 'label' when omitted.",
  }),
  target: Channel.annotate({
    description:
      "Quantitative target field shown as a vertical rule marker. Defaults to 'target' when omitted.",
  }),
}).mapFields(Struct.map(Schema.optionalKey));

export const BulletChartWidgetPayload = Schema.Struct({
  data: Schema.Array(BulletDatum).annotate({
    description:
      "Array of bullet chart rows. Each row must expose the fields used by marks.x, marks.y, and marks.target.",
  }),
  layout: PlotLayoutProps.annotate({
    description:
      "Plot layout options. All fields optional; omit to use defaults.",
  }).pipe(Schema.optionalKey),
  marks: BulletMarkProps.annotate({
    description:
      "Bullet chart mapping. Use marks.x for the bar value, marks.y for the row label, and marks.target for the reference marker.",
  }).pipe(Schema.optionalKey),
}).annotate({
  description:
    "Payload for render_bullet_chart_widget. Use for value-versus-target comparisons across one or more categories.",
  examples: [
    {
      data: [
        {
          label: "Revenue",
          value: 72,
          target: 80,
        },
      ],
      marks: {
        x: "value",
        y: "label",
        target: "target",
      },
    },
    {
      data: [
        { label: "Revenue", value: 72, target: 80 },
        { label: "Margin", value: 41, target: 50 },
      ],
      marks: {
        x: "value",
        y: "label",
        target: "target",
      },
    },
  ],
});
