import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/yatra-one";
import "@fontsource/tiro-devanagari-hindi";
import "@fontsource-variable/source-serif-4";
import "@fontsource/noto-serif-tamil";
import "./styles.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
