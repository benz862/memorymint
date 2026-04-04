import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import styles from "../../create/page.module.css";
import pageStyles from "./page.module.css";

export default async function SuccessPage({ params }: { params: { orderId: string } }) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { card_project: true, downloads: true },
  });

  if (!order || order.payment_status !== 'completed') {
    notFound();
  }

  const project = order.card_project;
  const downloadUrl = `/api/pdf/${project.id}?orderId=${order.id}`;

  return (
    <div className={styles.container} style={{ maxWidth: "700px", textAlign: "center" }}>
      <div className={pageStyles.successIcon}>💌</div>
      <h1 className={styles.title} style={{ marginBottom: "1rem" }}>Your card is ready!</h1>
      <p className={styles.subtitle} style={{ marginBottom: "3rem" }}>
        Thank you for your purchase. Your high-resolution, watermark-free card is ready to download.
      </p>

      <div className={styles.wizard} style={{ textAlign: "left" }}>
        <div className={pageStyles.orderSummary}>
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

        <a
          href={downloadUrl}
          download="memorymint-card.pdf"
          className={styles.btnNext}
          style={{ display: "block", textAlign: "center", padding: "1.25rem", fontSize: "1.1rem", marginTop: "2rem" }}
        >
          ⬇ Download Your Card PDF
        </a>

        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--muted-foreground)", fontSize: "0.9rem" }}>
          A download link has also been saved for this order.
          <br />
          You can bookmark this page to re-download anytime.
        </p>
      </div>

      <div style={{ marginTop: "3rem" }}>
        <Link href="/create" style={{ color: "var(--primary)", fontWeight: 500 }}>
          Create Another Card →
        </Link>
      </div>
    </div>
  );
}
