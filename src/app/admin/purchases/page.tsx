"use client";

import { useEffect, useState } from "react";

interface Purchase {
  id: string;
  order_number: string;
  email: string;
  product: string;
  card_type: "custom_card" | "designed_card";
  card_name: string | null;
  size: string;
  amount_usd: string;
  purchased_at: string;
  stripe_payment_id: string | null;
}

interface Summary {
  purchases: Purchase[];
  totalRevenue: string;
  count: number;
}

export default function AdminPurchasesPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/purchases")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const filtered = data?.purchases.filter(
    (p) =>
      !search ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.product.toLowerCase().includes(search.toLowerCase()) ||
      p.order_number?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e5e5e5", fontFamily: "'Inter', sans-serif", padding: "2rem" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, color: "#fff" }}>
              💳 Purchase Dashboard
            </h1>
            <p style={{ margin: "0.3rem 0 0", color: "#888", fontSize: "0.9rem" }}>MemoryMint — All completed orders</p>
          </div>
          {data && (
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <StatCard label="Total Revenue" value={`$${data.totalRevenue}`} accent="#4ade80" />
              <StatCard label="Orders" value={String(data.count)} accent="#60a5fa" />
            </div>
          )}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by email, product or order number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            borderRadius: 8,
            border: "1px solid #2a2a2a",
            background: "#141414",
            color: "#e5e5e5",
            fontSize: "0.95rem",
            marginBottom: "1.5rem",
            boxSizing: "border-box",
            outline: "none",
          }}
        />

        {/* Table */}
        {loading ? (
          <p style={{ color: "#888", textAlign: "center", padding: "4rem" }}>Loading purchases…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: "#888", textAlign: "center", padding: "4rem" }}>
            {data?.count === 0 ? "No completed purchases yet." : "No results match your search."}
          </p>
        ) : (
          <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #1e1e1e" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "#111", borderBottom: "1px solid #222" }}>
                  {["Date", "Email", "Product", "Size", "Amount", "Type", "Order #"].map((h) => (
                    <th key={h} style={{ padding: "0.85rem 1rem", textAlign: "left", color: "#888", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr
                    key={p.id}
                    style={{
                      background: i % 2 === 0 ? "#0d0d0d" : "#111",
                      borderBottom: "1px solid #1a1a1a",
                    }}
                  >
                    <td style={{ padding: "0.75rem 1rem", whiteSpace: "nowrap", color: "#aaa" }}>
                      {new Date(p.purchased_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "#e5e5e5" }}>{p.email}</td>
                    <td style={{ padding: "0.75rem 1rem", color: "#e5e5e5", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.product}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "#aaa" }}>{p.size === "5x7" ? '5×7"' : '4×6"'}</td>
                    <td style={{ padding: "0.75rem 1rem", color: "#4ade80", fontWeight: 600, whiteSpace: "nowrap" }}>
                      ${p.amount_usd}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{
                        fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: 4,
                        background: p.card_type === "designed_card" ? "#1e3a5f" : "#1e3a1e",
                        color: p.card_type === "designed_card" ? "#60a5fa" : "#4ade80",
                        fontWeight: 600,
                      }}>
                        {p.card_type === "designed_card" ? "Designed" : "Custom"}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "#555", fontFamily: "monospace", fontSize: "0.78rem" }}>
                      {p.order_number || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "0.85rem 1.4rem", textAlign: "center", minWidth: 130 }}>
      <div style={{ fontSize: "1.6rem", fontWeight: 700, color: accent }}>{value}</div>
      <div style={{ fontSize: "0.78rem", color: "#666", marginTop: 2 }}>{label}</div>
    </div>
  );
}
