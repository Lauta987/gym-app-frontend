import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

import {
  loadStoredGymTheme,
} from "./utils/theme";

import {
  configureGymPwaFromCurrentPath,
} from "./utils/gymPwa";

loadStoredGymTheme();

configureGymPwaFromCurrentPath()
  .catch((error) => {
    console.error(
      "No se pudo cargar la identidad del gimnasio:",
      error
    );
  });

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log(
          "Service Worker registrado:",
          registration.scope
        );
      })
      .catch((error) => {
        console.error(
          "Error al registrar Service Worker:",
          error
        );
      });
  });
}

createRoot(
  document.getElementById("root")!
).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
); 