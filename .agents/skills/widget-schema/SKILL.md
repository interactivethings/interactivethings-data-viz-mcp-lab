---
name: widget-schema
description: Design, review, or refactor LLM-facing schemas for Observable Plot widget charts. Use this whenever the user asks to create a chart payload schema, simplify chart props, align a domain schema with a widget implementation, remove styling controls from chart configuration, or separate chart structure from renderer and Plot implementation details. Especially relevant for work in `packages/domain/src/Chart/`, `packages/widget-*/src/`, and prompt or resource docs that teach chart schemas.
---

# Widget Schema

Design schemas for chart widgets that an LLM can use reliably.

The job of the schema is to describe chart structure and data mapping. The job of the widget is to translate that structure into Observable Plot marks and apply the product's visual design defaults.

## Use This Skill When

Use this skill when the user asks to:

- create a new chart widget payload schema
- simplify or refactor an existing chart schema
- review whether chart props are too implementation-specific
- align a domain schema with an Observable Plot widget implementation
- remove styling knobs from LLM-facing chart configuration
- make multiple chart schemas more consistent with each other

This skill is especially relevant in `packages/domain/src/Chart/` and `packages/widget-*/src/`.

## Core Model

Keep these responsibilities separate:

- Domain schema: chart intent, data mapping, structural variants
- Widget renderer: Plot translation, styling defaults, visual polish, color, opacity, line widths, curve choices, tooltip behavior
- Guidance/examples: teach the LLM the structural API, not renderer internals

If a prop exists only because the current widget implementation happens to use a specific Plot option, it probably does not belong in the schema.

## Design Principles

### 1. Prefer chart semantics over Plot internals

Use names that reflect what the user means, not what Plot happens to call the channel.

Prefer:

- `series`
- `variant`
- `stack`
- `direction`

Avoid exposing Plot-specific implementation props unless they are truly the user concept:

- `z`
- `x1` / `x2`
- `y1` / `y2`
- `fill` as a grouping proxy
- `stroke` as a grouping proxy

Example:

- Better schema prop: `series: "industry"`
- Widget translation: `z: series`, `fill: series`, `stroke: series`

### 2. Keep schemas structural

Good schema fields usually answer these questions:

- Which field is x?
- Which field is y?
- Is there a grouping dimension?
- Which structural variant of the chart is this?
- Is sorting or interval regularization needed?

These usually belong in the schema:

- `x`, `y`
- `series`
- `variant`
- `direction`
- `interval`
- `sort`
- chart-specific structural fields such as `value`, `target`, `size`, `facet`

These usually do not belong in the schema:

- `fillOpacity`
- `strokeWidth`
- `strokeOpacity`
- `opacity`
- `curve`
- `symbol`
- `marker`
- color schemes
- tooltip toggles

If the widget can choose a sensible default once and apply it consistently, keep that choice in the widget.

### 3. Keep one widget focused on one chart concept

Do not overload one schema to support several subtly different Plot constructors unless they are genuinely the same user-facing chart.

If the widget is an area chart, optimize for the common `areaY` case. If band areas become a distinct product concept, prefer a separate schema or widget rather than a broad, mixed abstraction.

### 4. Make defaults do the work

LLM-facing schemas should be easy to use with minimal props.

Good patterns:

- default `x` to `"x"`
- default `y` to `"y"`
- default `variant` to the most useful presentation
- derive grouping/color behavior from `series`

The fewer decisions the LLM has to make, the more consistent the outputs will be.

### 5. Examples are part of the API

Examples teach the model how to use the schema.

Examples should emphasize:

- data shape
- field mapping
- grouping/series
- structural variants

Examples should not teach:

- opacity tweaking
- stroke-width tweaking
- Plot implementation details

## Review Workflow

When asked to review or refactor a chart schema, follow this order:

1. Read the domain schema.
2. Read the widget implementation that consumes it.
3. Check the relevant Observable Plot docs for the intended constructor.
4. Identify which props are structural and which are renderer styling.
5. Propose a smaller schema using semantic names.
6. If asked to implement, update:
   - the domain schema
   - the widget renderer
   - LLM guidance, examples, and docs that teach the schema
7. Verify with the repo-required checks.

Do not stop at only changing TypeScript types if examples or prompt resources still teach the old API.

## Schema Rules

### Field naming

Prefer a shared vocabulary across chart types where possible:

- `x`
- `y`
- `series`
- `variant`
- `direction`
- `interval`
- `sort`

This consistency matters because the LLM learns from repetition across widgets.

### Structural variants

Use a small literal enum when the user is choosing between meaningful chart presentations.

Example:

```ts
export const AreaVariant = Schema.Literals(["area", "area-line"]);
```

This is better than leaking renderer implementation such as `showLine`, because it names the presentation rather than the drawing instruction.

### Grouping and color

If the user concept is “series”, expose `series`.

Do not make the LLM decide between `z`, `fill`, and `stroke` unless the product actually needs those as separate concepts.

The widget can translate:

```ts
const series = marks?.series;

Plot.areaY(data, {
  x,
  y,
  ...(series ? { z: series, fill: series } : {}),
});

Plot.lineY(data, {
  x,
  y,
  ...(series ? { z: series, stroke: series } : {}),
});
```

### Styling defaults

Put visual defaults in the widget, not the schema.

Examples:

```ts
fillOpacity: 0.3;
strokeWidth: 2;
tip: true;
scheme: "Category10";
```

These are good renderer defaults because they make charts look right without asking the LLM to art-direct them.

## Observable Plot Guidance

Choose the schema shape to match the Plot constructor you actually want to support.

Examples:

- If the widget is built around `Plot.areaY`, expose the `x` and `y` shorthand model.
- If the widget is built around `Plot.lineY`, optimize for `x`, `y`, and optional `series`.
- Avoid exposing `x1` / `x2` / `y1` / `y2` unless the widget is intentionally modeling the lower-level constructor.

The schema should reflect the supported abstraction, not every option Plot makes available.

## Implementation Expectations

When implementing a refactor with this skill:

- keep the schema minimal
- preserve useful structural capabilities
- move style and polish into the widget
- update examples to the new API
- update prompt resources or guidance docs that teach the schema
- run the required verification commands for the repo

If repo-wide checks fail because of unrelated pre-existing issues, state that clearly and do not treat them as caused by the schema refactor.

## Output Format

If the user asks for a review first, return:

1. Findings about the current schema
2. A proposed simpler schema
3. The reasoning behind the separation of concerns
4. Any migration notes for the widget or docs

If the user asks for implementation, make the code changes directly and then summarize:

1. What changed in the schema
2. What moved into the widget
3. Which docs/examples were updated
4. Verification results

## Examples

### Good

```ts
marks: {
  x: "date",
  y: "value",
  series: "industry",
  variant: "area-line",
}
```

Why it is good:

- expresses data mapping clearly
- exposes the user concept of series
- exposes a structural presentation choice
- leaves styling to the widget

### Bad

```ts
marks: {
  x: "date",
  y: "value",
  z: "industry",
  fill: "industry",
  fillOpacity: 0.2,
  strokeWidth: 1,
  curve: "basis",
  tip: true,
}
```

Why it is bad:

- mixes schema and styling concerns
- leaks Plot implementation details
- forces the LLM to make design decisions the widget should own
- teaches a noisier API than the product needs

## Success Criteria

The skill has done its job when:

- the schema is easy for an LLM to use correctly
- the widget still has enough information to render the intended chart type
- the product owns visual consistency in the renderer
- examples and docs reinforce the simplified API
- similar chart widgets start converging on the same vocabulary
