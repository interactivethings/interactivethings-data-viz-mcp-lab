import { Effect, Schema, String } from "effect";
import { McpServer } from "effect/unstable/ai";

export const barChartOneShot = McpServer.prompt({
  name: "Bar Chart One-Shot Prompt",
  description: "Provides a one-shot example of how to use the bar chart widget",
  parameters: {
    data: Schema.Record(Schema.String, Schema.Unknown),
  },
  content: ({ data }) =>
    Effect.succeed(
      String.stripMargin(`
        |## Create a bar chart using render_bar_chart_widget.  
        |- Build data as an array of objects.  
        |- Choose direction ("vertical" or "horizontal").  
        |- Map marks.x and marks.y to the exact field names in your data.  
        |- Use layout for sizing, margins, title/subtitle/caption, and grid.  
        |- If you need groups/series, use marks.fill (or marks.z) with a series field.
        |
        |Return only the JSON payload that matches BarChartWidgetPayload.
        |## Best practices (short)
        |- Keep categories short and sorted by value to aid scanning.
        |- Include a clear title and a brief caption for context/source.
        |- Use direction: "horizontal" for long category labels.
        |- Keep margins generous when labels are rotated or long.
        |- Use marks.fill only when multiple series are truly needed.
        |
        |Example payload
        |{
        |  "data": [
        |    { "month": "Jan", "sales": 120 },
        |    { "month": "Feb", "sales": 98 },
        |    { "month": "Mar", "sales": 140 },
        |    { "month": "Apr", "sales": 110 }
        |  ],
        |  "direction": "vertical",
        |  "layout": {
        |    "title": "Monthly Sales",
        |    "subtitle": "Q1 performance",
        |    "caption": "Source: Internal CRM",
        |    "grid": true,
        |    "marginLeft": 48,
        |    "marginBottom": 48
        |  },
        |  "marks": {
        |    "x": "month",
        |    "y": "sales",
        |    "tip": true
        |  }
        |}
        |
        |Channels for the data structure include: ${Object.keys(data).join(", ")}
        `),
    ),
});
