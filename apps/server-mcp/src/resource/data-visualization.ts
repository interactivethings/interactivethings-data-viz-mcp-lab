import { Effect } from "effect";
import { McpServer } from "effect/unstable/ai";
import { readPublicAsset } from "../UiResource";

const DataVisualizationResourceUri = "app://data-visualization";
const DataVisualizationMimeType = "text/markdown";

const DataVisualizationContent = readPublicAsset({
  importMetaDir: import.meta.dir,
  sourceSuffix: "src/resource",
  sourcePath: "../../public/data-visualization.md",
  distPath: "public/data-visualization.md",
});

export const DataVisualizationResourceLayer = McpServer.resource({
  uri: DataVisualizationResourceUri,
  name: "Data Visualization Practices",
  description: "Widget-focused guidance for choosing the right chart.",
  mimeType: DataVisualizationMimeType,
  content: Effect.map(DataVisualizationContent, (text) => ({
    contents: [
      {
        uri: DataVisualizationResourceUri,
        mimeType: DataVisualizationMimeType,
        text,
      },
    ],
  })),
});
