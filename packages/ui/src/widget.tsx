import type { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { ReactElement, ReactNode, RefObject } from "react";
import { createRoot } from "react-dom/client";

export type HostApp = NonNullable<ReturnType<typeof useApp>["app"]>;

type WidgetFrameProps = {
  children?: ReactNode;
  frameRef?: RefObject<HTMLDivElement | null>;
};

type WidgetStatusProps = {
  message: string;
};

export const mountWidgetApp = (element: ReactElement) => {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error("Widget root element not found");
  }

  createRoot(rootElement).render(element);
};

export const WidgetFrame = ({ children, frameRef }: WidgetFrameProps) => {
  return (
    <div
      ref={frameRef}
      style={{
        width: "100%",
        color: "var(--color-text-primary, #111)",
        backgroundColor: "var(--color-background-secondary, #fff)",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
      }}
    >
      {children}
    </div>
  );
};

export const WidgetStatus = ({ message }: WidgetStatusProps) => {
  return <div style={{ padding: 16 }}>{message}</div>;
};
