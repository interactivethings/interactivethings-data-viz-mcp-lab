import { useEffect, useRef, useState } from "react";

type SizeChangedSender = {
  sendSizeChanged: (params: { width?: number; height?: number }) => unknown;
};

export const useWidgetResize = (app?: SizeChangedSender | null) => {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const lastSizeRef = useRef<{ width: number; height: number } | null>(null);
  const scheduledRef = useRef(false);

  useEffect(() => {
    if (!frameRef.current) {
      return undefined;
    }

    const element = frameRef.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      const nextWidth = Math.floor(entry.contentRect.width);
      if (Number.isFinite(nextWidth) && nextWidth > 0) {
        setMeasuredWidth(nextWidth);
      }

      if (!app) {
        return;
      }

      if (scheduledRef.current) {
        return;
      }

      scheduledRef.current = true;
      requestAnimationFrame(() => {
        scheduledRef.current = false;

        const width = Math.ceil(entry.contentRect.width);
        const height = Math.ceil(entry.contentRect.height);
        if (!Number.isFinite(width) || !Number.isFinite(height)) {
          return;
        }

        const lastSize = lastSizeRef.current;
        if (lastSize?.width === width && lastSize?.height === height) {
          return;
        }

        lastSizeRef.current = { width, height };
        void app.sendSizeChanged({ width, height });
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [app]);

  return {
    frameRef,
    measuredWidth,
  };
};
