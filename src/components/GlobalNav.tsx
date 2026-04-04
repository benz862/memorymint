"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Logo from "@/components/Logo";

export default function GlobalNav() {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem 2rem",
        background: "var(--background)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Left — back button (hidden on homepage) */}
      <div style={{ minWidth: "80px" }}>
        {!isHome && (
          <button
            onClick={() => router.back()}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "0.4rem 0.85rem",
              fontSize: "0.85rem",
              color: "var(--muted-foreground)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--primary)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)";
            }}
            aria-label="Go back"
          >
            ← Back
          </button>
        )}
      </div>

      {/* Centre — logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center" }}>
        <Logo height={60} linked={false} />
      </Link>

      {/* Right — home button (hidden on homepage) */}
      <div style={{ minWidth: "80px", display: "flex", justifyContent: "flex-end" }}>
        {!isHome && (
          <Link
            href="/"
            style={{
              fontSize: "0.85rem",
              color: "var(--muted-foreground)",
              textDecoration: "none",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "0.4rem 0.85rem",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--primary)";
              (e.currentTarget as HTMLAnchorElement).style.color = "var(--primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLAnchorElement).style.color = "var(--muted-foreground)";
            }}
          >
            🏠 Home
          </Link>
        )}
      </div>
    </header>
  );
}
