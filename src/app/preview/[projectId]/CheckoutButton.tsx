"use client";

import { useState } from "react";
import styles from "../../create/page.module.css";

export default function CheckoutButton({ projectId, size }: { projectId: string; size: string }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, size }),
      });
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session.");
      }
    } catch (e) {
      console.error(e);
      alert("Error initiating checkout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      className={styles.btnNext}
      style={{ width: "100%", padding: "1rem", fontSize: "1.1rem" }}
      disabled={loading}
    >
      {loading ? "Redirecting to Secure Checkout..." : "Purchase High-Res PDF"}
    </button>
  );
}
