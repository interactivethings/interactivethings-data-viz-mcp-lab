import { createRoot } from "react-dom/client";
import { WidgetApp } from "./bar-chart";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Widget root element not found");
}

createRoot(rootElement).render(<WidgetApp />);
