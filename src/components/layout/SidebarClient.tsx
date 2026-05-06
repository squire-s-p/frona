"use client";

import * as React from "react";
import { Sidebar } from "@/components/ui/sidebar";

type SidebarProps = React.ComponentProps<typeof Sidebar>;

export default function SidebarClient(props: SidebarProps) {
  return <Sidebar {...props} />;
}
