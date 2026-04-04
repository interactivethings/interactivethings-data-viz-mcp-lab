import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
} from "geojson";
import { feature } from "topojson-client";
import countriesWorld from "world-atlas/countries-110m.json";
import world from "world-atlas/land-110m.json";

type TopologyObject = Parameters<typeof feature>[1];
type TopologyInput = Parameters<typeof feature>[0];

type TopologyWithObject<Key extends string> = TopologyInput & {
  objects: {
    [K in Key]: TopologyObject;
  };
};

export type GeoFeature = Feature<Geometry, GeoJsonProperties>;
export type GeoFeatureCollection = FeatureCollection<
  Geometry,
  GeoJsonProperties
>;

const asTopologyWithObject = <Key extends string>(
  value: unknown,
  key: Key,
): TopologyWithObject<Key> => {
  const topology = value as TopologyWithObject<Key>;
  if (!(key in topology.objects)) {
    throw new Error(`Missing TopoJSON object: ${key}`);
  }
  return topology;
};

const asFeatureCollection = (value: ReturnType<typeof feature>) => {
  if ("features" in value) {
    return value as GeoFeatureCollection;
  }

  return {
    type: "FeatureCollection",
    features: [value as GeoFeature],
  } satisfies GeoFeatureCollection;
};

const worldAtlas = asTopologyWithObject(world, "land");
const worldAtlasCountries = asTopologyWithObject(countriesWorld, "countries");

export const land = asFeatureCollection(
  feature(worldAtlas, worldAtlas.objects.land),
);
export const countries = asFeatureCollection(
  feature(worldAtlasCountries, worldAtlasCountries.objects.countries),
);
