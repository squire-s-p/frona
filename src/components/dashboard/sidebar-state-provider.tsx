"use client";

import React from "react";
import { useSidebarState } from "./use-sidebar-state";

export function SidebarStateProvider({
  children,
}: {
  children: (state: { collapsed: boolean; toggle: () => void }) => React.ReactNode;
}) {
  const { collapsed, setCollapsed } = useSidebarState(false);

  return children({
    collapsed,
    toggle: () => setCollapsed((v) => !v),
  });
}
