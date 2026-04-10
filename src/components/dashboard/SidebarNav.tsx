"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/tasks", label: "Tasks" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/finance", label: "Finance" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 260,
        borderRight: "1px solid rgba(255,255,255,0.08)",
        padding: 16,
        position: "sticky",
        top: 0,
        height: "100vh",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 16 }}>Dashboard</div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {nav.map((item) => {
          const active =
            pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                textDecoration: "none",
                color: "inherit",
                background: active ? "rgba(255,255,255,0.08)" : "transparent",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
