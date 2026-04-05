export const dynamic = "force-dynamic";

import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import styles from "../../create/page.module.css";
import CheckoutButton from "./CheckoutButton";

export default async function PreviewPage({ params }: { params: { projectId: string } }) {
  const { projectId } = await params;

  const project = await prisma.cardProject.findUnique({
    where: { id: projectId },
  });

  if (!project) notFound();

  // Determine final price
  const price = project.selected_size === "5x7" ? 5.99 : 3.99;

  return (
    <div className={styles.container} style={{ maxWidth: "1200px" }}>
      <header className={styles.header}>
        <h1 className={styles.title}>Your Card Preview</h1>
        <p className={styles.subtitle}>
          Here is a watermarked preview of your printable card.
        </p>
      </header>

      <main style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "3rem", alignItems: "start" }}>
        {/* PDF Preview Frame — #toolbar=0 hides the Chrome download button */}
        <div style={{ background: "var(--muted)", borderRadius: "var(--radius-lg)", overflow: "hidden", height: "700px", border: "1px solid var(--border)", position: "relative" }}>
          <iframe
            src={`/api/pdf/${projectId}#toolbar=0&navpanes=0&scrollbar=0`}
            width="100%"
            height="100%"
            style={{ border: "none" }}
            title="Card Preview"
          />
          {/* Transparent overlay blocks the Chrome PDF toolbar click area */}
          <div style={{ position: "absolute", bottom: 0, right: 0, width: "100%", height: "48px", pointerEvents: "none" }} />
        </div>

        {/* Checkout Panel */}
        <div className={styles.wizard}>
          <h2 className={styles.stepTitle}>Ready to Download?</h2>
          <p style={{ color: "var(--muted-foreground)", marginBottom: "2rem" }}>
            Purchase to remove the MemoryMint watermark and download the high-resolution, print-ready PDF file.
          </p>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", borderBottom: "1px solid var(--border)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
            <span>{project.selected_size} Premium Asset</span>
            <span style={{ fontWeight: "bold" }}>${price.toFixed(2)}</span>
          </div>

          <CheckoutButton projectId={projectId} size={project.selected_size || "5x7"} />
          
          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            <a href={`/customize/${projectId}`} style={{ color: "var(--muted-foreground)", fontSize: "0.9rem", textDecoration: "underline" }}>
              Back to Design Options
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
