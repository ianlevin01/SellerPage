import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/themes.css";
import "./styles/layout-recife.css";
import "./styles/layout-brasilia.css";
import "./styles/layout-lima.css";
import "./styles/layout-amazonas.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
