import { Schema, Struct } from "effect";
import {
  Channel,
  ChannelString,
  NumberGreaterThanZero,
  PlotLayoutProps,
} from "./shared";

export const GeoDatumValue = Schema.Union([
  Schema.String,
  Schema.Number,
  Schema.NumberFromString,
  Schema.Boolean,
  Schema.Date,
  Schema.Null,
]);

export const GeoDatum = Schema.Record(Schema.String, GeoDatumValue).annotate({
  description:
    "Single geo-chart data object. Keys are column names used by point or choropleth mark mappings.",
  examples: [
    {
      city: "San Francisco",
      latitude: 37.7749,
      longitude: -122.4194,
      population: 42,
    },
    { country: "Canada", value: 63 },
  ],
});

export const GeoProjectionType = Schema.Literals([
  "equirectangular",
  "orthographic",
  "stereographic",
  "mercator",
  "equal-earth",
  "azimuthal-equal-area",
  "azimuthal-equidistant",
  "conic-conformal",
  "conic-equal-area",
  "conic-equidistant",
  "gnomonic",
  "transverse-mercator",
  "albers",
  "albers-usa",
  "identity",
  "reflect-y",
]);

export const GeoProjection = Schema.Union([
  GeoProjectionType,
  Schema.Struct({
    type: GeoProjectionType,
    rotate: Schema.Union([
      Schema.Tuple([Schema.Number, Schema.Number]),
      Schema.Tuple([Schema.Number, Schema.Number, Schema.Number]),
    ]),
    inset: NumberGreaterThanZero,
    clip: Schema.Union([Schema.Boolean, Schema.Number, Schema.Null]),
  }).mapFields(Struct.map(Schema.optionalKey)),
]);

const GeoSort = Schema.Union([
  Schema.String,
  Schema.Null,
  Schema.Struct({
    channel: Schema.String,
    order: Schema.Literals(["ascending", "descending"]),
  }),
]);

export const GeoLandMark = Schema.Struct({
  _tag: Schema.Literal("land"),
});

export const GeoSphereMark = Schema.Struct({
  _tag: Schema.Literal("sphere"),
});

export const GeoGraticuleMark = Schema.Struct({
  _tag: Schema.Literal("graticule"),
});

export const GeoPointMark = Schema.Struct({
  _tag: Schema.Literal("point"),
  longitude: Channel.annotate({
    description: "Longitude field or constant value. Defaults to 'longitude'.",
  }),
  latitude: Channel.annotate({
    description: "Latitude field or constant value. Defaults to 'latitude'.",
  }),
  size: Schema.Union([Channel, Schema.NumberFromString]).annotate({
    description:
      "Optional point size field or constant radius. Use this for bubble-map style points.",
  }),
  series: ChannelString.annotate({
    description: "Optional categorical field for grouped point color encoding.",
  }),
  title: ChannelString.annotate({
    description: "Optional field used for point titles or tooltips.",
  }),
  sort: GeoSort.annotate({
    description:
      "Optional sort for point drawing order. Use null to preserve input order.",
  }),
}).mapFields(Struct.map(Schema.optionalKey));

export const GeoChoroplethMark = Schema.Struct({
  _tag: Schema.Literal("choropleth"),
  dataKey: ChannelString.annotate({
    description:
      "Data field used to join each row to a built-in world country feature. Defaults to 'id'.",
  }),
  featureKey: Schema.Literals(["id", "name"]).annotate({
    description:
      "Which built-in country feature property to join against. Use 'name' for country names or 'id' for numeric ISO ids.",
  }),
  value: ChannelString.annotate({
    description:
      "Numeric field used to color each matched country feature. Defaults to 'value'.",
  }),
  title: ChannelString.annotate({
    description: "Optional field used for choropleth titles or tooltips.",
  }),
}).mapFields(Struct.map(Schema.optionalKey));

export const GeoChartMark = Schema.Union([
  GeoLandMark,
  GeoSphereMark,
  GeoGraticuleMark,
  GeoPointMark,
  GeoChoroplethMark,
]);

export const GeoChartWidgetPayload = Schema.Struct({
  data: Schema.Array(GeoDatum).annotate({
    description:
      "Array of geo data objects. Point and choropleth marks consume this data; basemap marks ignore it.",
  }),
  layout: PlotLayoutProps.annotate({
    description:
      "Plot layout options. All fields optional; omit to use defaults.",
  }).pipe(Schema.optionalKey),
  projection: GeoProjection.pipe(Schema.optionalKey),
  marks: Schema.Array(GeoChartMark).annotate({
    description:
      "Ordered geo mark list. Start with basemap marks such as sphere, land, or graticule, then add data-driven marks such as point or choropleth.",
  }),
}).annotate({
  description:
    "Payload for render_geo_chart_widget. Use for projected maps with optional basemap layers, geographic points, or country choropleths.",
  examples: [
    {
      data: [
        {
          city: "San Francisco",
          latitude: 37.7749,
          longitude: -122.4194,
          population: 808988,
        },
      ],
      projection: "equal-earth",
      marks: [
        { _tag: "sphere" },
        { _tag: "land" },
        {
          _tag: "point",
          latitude: "latitude",
          longitude: "longitude",
          size: "population",
          title: "city",
        },
      ],
    },
    {
      data: [
        { country: "Canada", value: 42 },
        { country: "United States of America", value: 63 },
      ],
      projection: "equal-earth",
      marks: [
        { _tag: "sphere" },
        {
          _tag: "choropleth",
          featureKey: "name",
          dataKey: "country",
          value: "value",
        },
      ],
    },
  ],
});
