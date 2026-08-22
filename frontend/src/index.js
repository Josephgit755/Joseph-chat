import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(
  document.getElementById("root")
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ==========================================
// ZENVAZAPP PWA SERVICE WORKER
// ==========================================

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log(
          "ZenvaZapp service worker registered:",
          registration.scope
        );
      })
      .catch((error) => {
        console.error(
          "ZenvaZapp service worker registration failed:",
          error
        );
      });
  });
}