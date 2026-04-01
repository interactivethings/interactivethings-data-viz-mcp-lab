import { createRoot } from "react-dom/client";
import { WidgetApp } from "./line-chart";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Widget root element not found");
}

createRoot(rootElement).render(<WidgetApp />);
