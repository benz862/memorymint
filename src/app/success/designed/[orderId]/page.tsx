import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import styles from "../../../create/page.module.css";
import pageStyles from "../../[orderId]/page.module.css";

export default async function DesignedCardSuccessPage({
  params,
}: {
  params: { orderId: string };
}) {
  const { orderId } = await params;

  const order = await prisma.designedCardOrder.findUnique({
    where: { id: orderId },
    include: { designed_card: true },
  });

  if (!order || order.payment_status !== "completed") {
    notFound();
  }

  // Full PDF download URL (unwatermarked) — uses ?paid=1 alongside payment_status check
  const downloadUrl = `/api/pdf/designed/${order.id}?paid=1`;

  return (
    <div className={styles.container} style={{ maxWidth: "700px", textAlign: "center" }}>
      <div className={pageStyles.successIcon}>💌</div>
      <h1 className={styles.title} style={{ marginBottom: "1rem" }}>
        Your card is ready!
      </h1>
      <p className={styles.subtitle} style={{ marginBottom: "3rem" }}>
        Thank you! Your 4-panel print-ready card PDF is below. Fold in half twice and it&apos;s
        ready to deliver.
      </p>

      <div className={styles.wizard} style={{ textAlign: "left" }}>
        <div className={pageStyles.orderSummary}>
          <div className={pageStyles.summaryRow}>
            <span>Card Design</span>
            <strong>{order.designed_card.name}</strong>
          </div>
          <div className={pageStyles.summaryRow}>
            <span>Order Number</span>
            <strong>{order.order_number}</strong>
          </div>
          <div className={pageStyles.summaryRow}>
            <span>Card Size</span>
            <strong>{order.selected_size}</strong>
          </div>
          <div className={pageStyles.summaryRow}>
            <span>Amount Paid</span>
            <strong>${(order.amount / 100).toFixed(2)}</strong>
          </div>
        </div>

        {/* Printing instructions */}
        <div
          style={{
            background: "var(--muted)",
            borderRadius: "var(--radius-md)",
            padding: "1.25rem 1.5rem",
            marginTop: "1.5rem",
            marginBottom: "1.5rem",
            fontSize: "0.88rem",
            color: "var(--muted-foreground)",
            lineHeight: 1.7,
          }}
        >
          <strong style={{ color: "var(--foreground)", display: "block", marginBottom: "0.5rem" }}>
            📄 Printing Instructions
          </strong>
          Your PDF contains 2 landscape pages (the outer spread and inner spread). Print both
          pages double-sided on a single sheet of card stock, then fold in half twice. Cut/fold
          guide marks are included.
        </div>

        <a
          href={downloadUrl}
          download={`memorymint-card-${order.order_number}.pdf`}
          className={styles.btnNext}
          style={{
            display: "block",
            textAlign: "center",
            padding: "1.25rem",
            fontSize: "1.1rem",
            marginTop: "1rem",
          }}
        >
          ⬇ Download Your Card PDF
        </a>

        <p
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            color: "var(--muted-foreground)",
            fontSize: "0.9rem",
          }}
        >
          Bookmark this page to re-download anytime.
        </p>
      </div>

      <div style={{ marginTop: "3rem", display: "flex", gap: "2rem", justifyContent: "center" }}>
        <Link href="/catalogue" style={{ color: "var(--primary)", fontWeight: 500 }}>
          Browse More Cards →
        </Link>
        <Link href="/create" style={{ color: "var(--muted-foreground)", fontWeight: 500 }}>
          Create a Custom Card →
        </Link>
      </div>
    </div>
  );
}
