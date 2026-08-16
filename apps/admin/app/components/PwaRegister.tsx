"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    if (!("serviceWorker" in navigator) || (window.location.protocol !== "https:" && !isLocalhost)) return;

    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // PWA install remains optional; admin should never fail because SW registration did.
      });
    });
  }, []);

  return null;
}
