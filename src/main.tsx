import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { applyGymTheme } from "./utils/theme";

const savedGymTheme = localStorage.getItem("gymTheme");

if (savedGymTheme) {
  try {
    applyGymTheme(JSON.parse(savedGymTheme));
  } catch {
    localStorage.removeItem("gymTheme");
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
); 