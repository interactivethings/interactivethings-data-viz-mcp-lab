import { Effect, FileSystem, Path } from "effect";
import { McpServer } from "effect/unstable/ai";

const DataVisualizationResourceUri = "app://data-visualization";
const DataVisualizationMimeType = "text/markdown";

const DataVisualizationContent = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const sourceSuffix = path.join("resource");
  const isSourcePath = import.meta.dir.endsWith(sourceSuffix);
  const mdPath = isSourcePath
    ? path.join(import.meta.dir, "data-visualization.md")
    : path.join(import.meta.dir, "resource/data-visualization.md");
  return yield* fs.readFileString(mdPath);
});

export const DataVisualizationResourceLayer = McpServer.resource({
  uri: DataVisualizationResourceUri,
  name: "Data Visualization Practices",
  description: "Widget-focused guidance for chart selection and payloads.",
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
