import * as Plot from "@observablehq/plot";
import { type ComponentPropsWithoutRef, type RefObject, useRef } from "react";

import { usePlotRenderer } from "./usePlotRenderer";

type PlotOptions = Parameters<typeof Plot.plot>[0];

export type PlotFigureProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "children"
> & {
  options: PlotOptions;
  dependencies?: ReadonlyArray<unknown>;
  containerRef?: RefObject<HTMLDivElement | null>;
};

export const PlotFigure = ({
  options,
  dependencies,
  containerRef,
  ...props
}: PlotFigureProps) => {
  const internalRef = useRef<HTMLDivElement | null>(null);
  const plotContainerRef = containerRef ?? internalRef;

  usePlotRenderer({
    containerRef: plotContainerRef,
    dependencies: dependencies ?? [options],
    renderPlot: () =>
      Plot.plot({
        style: "--plot-background: var(--color-background-primary);",
        ...options,
      }),
  });

  return <div ref={plotContainerRef} {...props} />;
};
