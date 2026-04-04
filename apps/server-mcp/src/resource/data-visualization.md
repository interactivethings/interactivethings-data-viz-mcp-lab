# Data Visualization Selection Guide

Use this guide to choose the right widget for a user's data and question.

Pick the simplest chart that answers the user's question well. Prefer charts
with accurate comparison over charts that look more dramatic.

This guide only covers widgets that exist in this server:

- `render_line_chart_widget`
- `render_area_chart_widget`
- `render_bar_chart_widget`
- `render_histogram_widget`
- `render_box_plot_widget`
- `render_scatterplot_widget`
- `render_heatmap_widget`
- `render_treemap_widget`
- `render_geo_chart_widget`
- `render_bullet_chart_widget`

## How To Choose

Start from the user's analytic goal, not from a favorite chart type.

1. If the user wants to show change over an ordered dimension, prefer a line chart.
2. If the user wants to compare categories, prefer a bar chart.
3. If the user wants to show a distribution, choose histogram or box plot.
4. If the user wants to show relationship between two quantitative variables, choose scatterplot.
5. If the user wants to show a matrix of values across two categorical axes, choose heatmap.
6. If the user wants part-to-whole and there is only one flat level of categories, consider treemap.
7. If the user wants value versus target, choose bullet chart.
8. If geography is essential to the message, choose geo chart.

If two charts could work, prefer the one that supports more accurate reading.

## Quick Selection Table

| User intent                                     | Best widget  | Use when                                                                | Prefer instead of                                            |
| ----------------------------------------------- | ------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------ |
| Trend over time or another ordered axis         | Line chart   | The main message is direction, slope, or comparison over sequence       | Area chart when filled magnitude is not important            |
| Magnitude over time or composition over time    | Area chart   | Filled area helps communicate accumulated volume or stacked composition | Line chart when only the topline matters                     |
| Compare or rank categories                      | Bar chart    | Users need precise comparison across categories                         | Treemap when exact comparison matters                        |
| Distribution of one variable                    | Histogram    | You have raw observations and want to show frequency by bin             | Box plot when comparing grouped distributions                |
| Distribution across groups                      | Box plot     | You want quartiles, median, spread, and outliers by category            | Histogram when shape of one distribution is the main message |
| Relationship between two quantitative variables | Scatterplot  | You want correlation, clustering, or outliers                           | Heatmap when the data is already a matrix                    |
| Matrix comparison                               | Heatmap      | Each row already represents one cell value across x and y categories    | Scatterplot for raw point clouds                             |
| Flat part-to-whole composition                  | Treemap      | You have one level of categories and area comparison is acceptable      | Bar chart for more precise comparison                        |
| Geographic point or country pattern             | Geo chart    | Location itself matters to the story                                    | Bar chart when geography is incidental                       |
| Actual value versus target                      | Bullet chart | You need to compare one or more values against explicit targets         | Bar chart when there is no target                            |

## Decision Rules

### Line Chart

Choose line charts for trends across time or another naturally ordered axis.

Good fit:

- month-by-month, day-by-day, year-over-year, or step-by-step change
- one or a few series with a shared ordered x-axis
- questions about rise, fall, crossover, or volatility

Prefer line over area when:

- the exact path matters more than accumulated magnitude
- several series need to be compared clearly

Avoid line when:

- x is just a set of unrelated categories
- the user is comparing totals across categories rather than change

### Area Chart

Choose area charts when filled magnitude adds meaning.

Good fit:

- traffic volume over time
- totals over time where the area communicates amount
- stacked composition over time with a small number of series

Prefer area over line when:

- the user cares about volume as well as direction
- stacked composition over time is the main message

Avoid area when:

- many series would overlap or stack into an unreadable chart
- exact comparison between middle stacked series matters

### Bar Chart

Choose bar charts for category comparison and ranking.

Good fit:

- comparing products, teams, regions, or time periods as discrete buckets
- ranking top or bottom performers
- comparing totals across categories

Use horizontal bars when:

- labels are long
- ranking is the main message

Use stacked bars when:

- the user wants part-to-whole within each category
- there are only a few series

Avoid bar when:

- the x-axis is continuous time and the story is trend
- there are too many stacked segments for reliable comparison

### Histogram

Choose histograms for the distribution of one quantitative or temporal variable.

Good fit:

- spread of salaries, ages, response times, or weights
- questions about skew, clusters, gaps, or rough shape
- raw observations that still need binning

Prefer histogram over box plot when:

- the shape of the distribution matters
- there is only one main variable to summarize

Avoid histogram when:

- the data is already summarized into quartiles
- the user mainly needs grouped comparison of medians and spread

### Box Plot

Choose box plots for comparing distributions across categories.

Good fit:

- score distribution by team
- response time distribution by service
- salary distribution by department

Prefer box plot over histogram when:

- there are several groups to compare side by side
- quartiles, median, spread, and outliers are the main message

Avoid box plot when:

- the user needs the full shape of the distribution
- there is no categorical grouping dimension

Important:

- box plots should be built from raw observations, not precomputed quartiles

### Scatterplot

Choose scatterplots for relationships between two quantitative variables.

Good fit:

- revenue versus margin
- horsepower versus fuel economy
- latency versus throughput
- cluster, correlation, and outlier analysis

This widget also works for bubble-style charts when size adds a third variable.

Prefer scatterplot over heatmap when:

- the data consists of individual observations, not precomputed matrix cells

Avoid scatterplot when:

- both axes are categorical
- there are so many points that overplotting hides the pattern and a different summary is needed

### Heatmap

Choose heatmaps for a matrix of values across two categorical axes.

Good fit:

- month by region sales
- weekday by hour activity
- team by metric scorecards

Use heatmap when:

- each row already represents one cell value
- color is the main comparison channel

Prefer heatmap over scatterplot when:

- the data is already aggregated into a grid or matrix

Avoid heatmap when:

- the user needs precise positional reading more than matrix scanning
- the matrix is so large that labels and color differences become unreadable

### Treemap

Choose treemaps for flat part-to-whole composition.

Good fit:

- portfolio composition
- category contribution to a whole
- share of total across a modest number of categories

Use treemap only when:

- there is a single flat level of categories
- area comparison is acceptable

Prefer bar chart over treemap when:

- precise comparison matters more than compact part-to-whole presentation
- ranking is part of the message

Avoid treemap when:

- the data is hierarchical across multiple parent-child levels
- there are too many tiny categories to label or compare

### Geo Chart

Choose geo charts only when geography is essential.

Good fit:

- city locations with magnitude encoded as point size
- country-level choropleths
- any story where position on a map is meaningful

This widget supports:

- projected point maps
- country choropleths
- simple basemap layers such as sphere, land, and graticule

Prefer geo chart over bar chart only when:

- the user needs to reason about spatial location, regional clustering, or map context

Avoid geo chart when:

- geography is just decoration
- a ranked bar chart would make the comparison clearer

Important:

- choropleths are for country-level joins in this widget, not arbitrary custom polygons

### Bullet Chart

Choose bullet charts for value-versus-target comparison.

Good fit:

- actual versus target revenue by product line
- KPI versus goal by team
- one or more categories where each row has a current value and a target

Prefer bullet chart over bar chart when:

- the target is central to the question
- the user wants to compare actual performance against a benchmark

Avoid bullet chart when:

- there is no explicit target
- the user wants a single dashboard-style gauge display rather than precise comparison

## Common Ambiguities

### Line vs Area

Choose line when the message is trend.

Choose area when the message is trend plus magnitude, or composition over time.

### Bar vs Treemap

Choose bar when the user needs precise comparison or ranking.

Choose treemap when the user wants compact flat part-to-whole composition and can tolerate area-based comparison.

### Histogram vs Box Plot

Choose histogram for one variable's distribution shape.

Choose box plot for grouped distribution comparison.

### Heatmap vs Scatterplot

Choose heatmap for precomputed matrix cells.

Choose scatterplot for raw observations positioned by two quantitative variables.

### Bullet vs Bar

Choose bullet when target comparison is part of the question.

Choose bar when the user only wants category comparison.

### Geo vs Non-Geo Charts

Choose geo only when the map itself adds meaning.

If the user is really comparing categories such as countries or regions by value,
and spatial position is not the point, prefer bar.

## Good Practices

- Prefer the most readable chart, not the most decorative one.
- Use direct comparison charts when users need exact judgment.
- Keep category counts manageable.
- Sort categories by value unless a natural order exists.
- Use horizontal bars for long labels.
- Use line or area only when the x-axis is meaningfully ordered.
- Use heatmaps and treemaps only when color or area comparison is acceptable.
- Use geo charts only when location matters.
- Use bullet charts when a target or benchmark is explicit.

## Bad Practices

- Do not choose pie or donut charts by default.
- Do not choose 3D charts.
- Do not choose dual-axis charts unless the user explicitly asks and the labeling can be made very clear.
- Do not choose a treemap when a bar chart would answer the question more accurately.
- Do not choose a geo chart just because the data contains place names.
- Do not choose a box plot from pre-aggregated quartiles; it expects raw observations.
- Do not choose a histogram from pre-binned counts; it expects raw observations.

## Unsupported Chart Families

These are not available as widgets here, so choose a supported alternative instead.

- Pie and donut: usually replace with bar or treemap
- Gauge: usually replace with bullet chart
- Funnel: usually replace with bar chart if the stages are simple
- Network graph: usually replace with bar, scatterplot, or heatmap depending on the question
- Sankey: not available
- Chord diagram: not available
- Violin plot: not available
- Small multiples as one widget: use separate widgets instead

## LLM Guidance

When the human request is vague, infer the chart from the question they are asking.

Examples of intent mapping:

- "How has this changed over time?" -> line chart
- "Which category is biggest or smallest?" -> bar chart
- "What does the distribution look like?" -> histogram
- "How do these groups differ in spread?" -> box plot
- "Are these two measures related?" -> scatterplot
- "Show this matrix of scores" -> heatmap
- "How do these parts contribute to the whole?" -> treemap
- "Where are these values located geographically?" -> geo chart
- "How far are we from target?" -> bullet chart

If the request is still ambiguous after that, ask one short clarifying question.
