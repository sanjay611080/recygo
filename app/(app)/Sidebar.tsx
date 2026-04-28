"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Role } from "@/lib/types";

type IconName = "scanner" | "dashboard" | "products" | "admin" | "logout";

interface NavItem {
  href: string;
  icon: IconName;
  label: string;
}

function Icon({ name }: { name: IconName }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "scanner":
      return (
        <svg {...common}>
          <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h2L9 4h6l1.5 2h2A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
      );
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="4" y="13" width="3.5" height="7" rx="1" />
          <rect x="10.25" y="9" width="3.5" height="11" rx="1" />
          <rect x="16.5" y="5" width="3.5" height="15" rx="1" />
        </svg>
      );
    case "products":
      return (
        <svg {...common}>
          <path d="M4 6h2l2 11h10l2-7H7" />
          <circle cx="9.5" cy="20" r="1.4" />
          <circle cx="17" cy="20" r="1.4" />
        </svg>
      );
    case "admin":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M15 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
          <path d="M10 17l-5-5 5-5" />
          <path d="M15 12H5" />
        </svg>
      );
  }
}

export default function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const router = useRouter();

  const items: NavItem[] = [
    { href: "/scanner", icon: "scanner", label: "Scanner" },
    { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
    { href: "/products", icon: "products", label: "Products" },
  ];
  if (role === "admin") {
    items.push({ href: "/admin", icon: "admin", label: "Admin" });
  }

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" title="RECYGO">
        ♻
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-icon${active ? " active" : ""}`}
              title={item.label}
              aria-label={item.label}
            >
              <Icon name={item.icon} />
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        className="nav-icon nav-logout"
        title="Logout"
        aria-label="Logout"
        onClick={handleLogout}
      >
        <Icon name="logout" />
      </button>
    </aside>
  );
}
