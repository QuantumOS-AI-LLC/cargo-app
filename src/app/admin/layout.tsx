"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { SessionProvider } from "next-auth/react";

function AdminSidebar() {
  const pathname = usePathname();
  const links = [
    { href: "/admin", label: "Overview", icon: "📊" },
    { href: "/admin/users", label: "Users", icon: "👥" },
    { href: "/admin/submissions", label: "Submissions", icon: "📋" },
  ];
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <div className="admin-sidebar-title">CargoDeductible</div>
        <div className="admin-sidebar-subtitle">Admin Panel</div>
      </div>
      <nav className="admin-nav">
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`admin-nav-item${pathname === l.href ? " active" : ""}`}
          >
            <span>{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>
      <div style={{ padding: "12px" }}>
        <button className="btn-signout" onClick={() => signOut({ callbackUrl: "/admin/login" })}>
          🚪 Sign out
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <SessionProvider>{children}</SessionProvider>;
  }

  return (
    <SessionProvider>
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">{children}</div>
      </div>
    </SessionProvider>
  );
}
