import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import CardConfigurator from "./CardConfigurator";
import styles from "../catalogue.module.css";
import Logo from "@/components/Logo";

// Always fetch the correct card fresh — prevents Vercel serving a stale cached page
export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const card = await prisma.designedCard.findUnique({ where: { slug } });
  if (!card) return { title: "Card Not Found — MemoryMint" };
  return {
    title: `${card.name} — MemoryMint`,
    description:
      card.description ||
      `Personalise ${card.name} with your own photo and message. Download a print-ready 4-panel PDF.`,
  };
}

export default async function CardDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const card = await prisma.designedCard.findUnique({
    where: { slug, is_active: true },
  });

  if (!card) notFound();

  return (
    <div className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <Logo height={85} />
        <Link href="/catalogue" className="btn-secondary" style={{ fontSize: "0.9rem" }}>
          ← Back to Catalogue
        </Link>
      </nav>

      {/* Breadcrumb */}
      <div
        style={{
          padding: "1rem 2rem 0",
          maxWidth: "1100px",
          margin: "0 auto",
          fontSize: "0.82rem",
          color: "var(--muted-foreground)",
        }}
      >
        <Link href="/catalogue" style={{ color: "var(--primary)" }}>
          Catalogue
        </Link>
        {" / "}
        <span style={{ textTransform: "capitalize" }}>{card.category}</span>
        {" / "}
        <span>{card.name}</span>
      </div>

      {/* Configurator */}
      <CardConfigurator card={card} />
    </div>
  );
}
