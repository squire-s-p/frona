"use client";

import { useEffect, useState } from "react";

const KEY = "dashboard.sidebarCollapsed";

export function useSidebarState(defaultCollapsed = false) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === null) return;
      setCollapsed(raw === "1");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);

  return { collapsed, setCollapsed };
}
