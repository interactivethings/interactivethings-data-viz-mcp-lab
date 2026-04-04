import { type RefObject, useEffect } from "react";

type PlotRenderContext = {
  width?: number;
};

type UsePlotRendererOptions = {
  containerRef: RefObject<HTMLDivElement | null>;
  width?: number;
  renderPlot: (context: PlotRenderContext) => Element;
  dependencies: ReadonlyArray<unknown>;
};

export const usePlotRenderer = ({
  containerRef,
  width,
  renderPlot,
  dependencies,
}: UsePlotRendererOptions) => {
  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const plot = renderPlot(width ? { width } : {});
    containerRef.current.replaceChildren(plot);

    return () => plot.remove();
  }, [containerRef, width, renderPlot, ...dependencies]);
};
