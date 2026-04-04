# Data Visualization Practices for Widgets

Practical guidance for choosing chart types and structuring payloads for the
widget tools: render_bar_chart_widget, render_line_chart_widget, and
render_scatterplot_widget.

## Chart Selection Guide (Widget-Mapped)

| What You Are Showing         | Best Widget                                          | Alternatives                   |
| ---------------------------- | ---------------------------------------------------- | ------------------------------ |
| Trend over time              | Line chart widget                                    | Stacked area (not implemented) |
| Comparison across categories | Bar chart widget                                     | Lollipop (not implemented)     |
| Ranking                      | Bar chart widget (horizontal)                        | Dot plot (not implemented)     |
| Part-to-whole composition    | Bar chart widget with marks.fill (stacked)           | Treemap (not implemented)      |
| Composition over time        | Line chart widget (multiple series)                  | Stacked area (not implemented) |
| Distribution                 | Histogram (not implemented)                          | Box plot (not implemented)     |
| Correlation (2 variables)    | Scatterplot widget                                   | Bubble chart (not implemented) |
| Correlation (many variables) | Heatmap (not implemented)                            | Pair plot (not implemented)    |
| Geographic patterns          | Map (not implemented)                                | Bubble map (not implemented)   |
| Flow / process               | Sankey (not implemented)                             | Funnel (not implemented)       |
| Relationship network         | Network graph (not implemented)                      | Chord (not implemented)        |
| Performance vs. target       | Bullet chart (not implemented)                       | Gauge (not implemented)        |
| Multiple KPIs at once        | Small multiples (not implemented as a single widget) | Dashboard of separate widgets  |

## When NOT to Use Certain Charts

- Pie/Donut: avoid unless <6 categories and only rough proportions matter.
  (Pie/Donut not implemented.)
- 3D charts: never. They distort perception. (Not implemented.)
- Dual-axis: avoid unless clearly labeled; can mislead.
- Stacked bars with many categories: hard to compare middle segments.

## Widget Payload Patterns

### Interactivity (Tooltips)

Enable tooltips by setting `marks.tip` to `true` in the widget payload. The
tooltip will include all fields from the underlying data row.

```json
{
  "data": [
    { "category": "Q1", "value": 120, "region": "EU" }
  ],
  "direction": "vertical",
  "marks": { "x": "category", "y": "value", "tip": true }
}
```

### Line Chart (Time Series)

Use for trends. For dates, prefer Date objects or epoch milliseconds and set
layout.x.type to "utc" with calendar ticks.

```json
{
  "data": [
    { "date": "2024-01-01", "value": 120, "series": "Alpha" },
    { "date": "2024-02-01", "value": 98, "series": "Alpha" },
    { "date": "2024-01-01", "value": 80, "series": "Beta" },
    { "date": "2024-02-01", "value": 110, "series": "Beta" }
  ],
  "layout": {
    "title": "Metric trend",
    "subtitle": "By series",
    "caption": "Source: Internal",
    "grid": true,
    "x": { "type": "utc", "ticks": "month", "tickFormat": "%b" },
    "y": { "label": "Value" }
  },
  "marks": {
    "x": "date",
    "y": "value",
    "z": "series",
    "tip": true
  }
}
```

### Bar Chart (Comparison or Ranking)

Use direction "horizontal" when labels are long. Keep bars starting at zero.

```json
{
  "data": [
    { "category": "Q1", "value": 120 },
    { "category": "Q2", "value": 98 },
    { "category": "Q3", "value": 140 },
    { "category": "Q4", "value": 110 }
  ],
  "direction": "vertical",
  "layout": {
    "title": "Quarterly sales",
    "grid": true,
    "y": { "label": "Sales" }
  },
  "marks": { "x": "category", "y": "value", "tip": true }
}
```

Stacked bars (part-to-whole): set marks.fill (or marks.z) to a series key.

```json
{
  "data": [
    { "quarter": "Q1", "region": "EU", "value": 40 },
    { "quarter": "Q1", "region": "NA", "value": 80 },
    { "quarter": "Q2", "region": "EU", "value": 30 },
    { "quarter": "Q2", "region": "NA", "value": 68 }
  ],
  "direction": "vertical",
  "marks": { "x": "quarter", "y": "value", "fill": "region", "tip": true }
}
```

### Scatterplot (Correlation)

Use for two quantitative variables. Add size or color via marks.r or marks.fill.

```json
{
  "data": [
    { "x": 10, "y": 22, "group": "A" },
    { "x": 15, "y": 18, "group": "B" }
  ],
  "layout": {
    "title": "Correlation",
    "x": { "label": "Metric A" },
    "y": { "label": "Metric B" }
  },
  "marks": { "x": "x", "y": "y", "fill": "group", "tip": true }
}
```

## Layout and Scale Guidance

- Time series: set layout.x.type to "utc" (recommended) or "time".
- Bar charts: keep y-axis starting at zero to avoid exaggeration.
- Use layout.x.ticks or layout.x.interval for readable date ticks.
- Use layout.title/subtitle/caption to state the insight and context.
- Use layout.grid sparingly; let data be the focus.

## Design Principles

- Color encodes data, not decoration. Use a single accent to highlight.
- Sort categories by value unless a natural order exists.
- Keep labels short; switch to horizontal bars for long labels.
- Use direct labels for key points rather than cluttering everything.
- Maintain consistent scales across related charts.

## Accessibility

- Do not rely on color alone. Use direct labels or symbols.
- Ensure text is legible (>= 10pt labels, >= 12pt titles).
- Provide a caption and data context for screen readers.

## Not Implemented (Widget Gaps)

- Area, stacked area
- Histogram, box plot, violin plot
- Heatmap, treemap
- Choropleth or any map-based chart
- Sankey, funnel
- Network graph, chord diagram
- Bullet, gauge
- Pie, donut
- Small multiples as a single widget (use multiple widgets instead)
