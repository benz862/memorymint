import Link from "next/link";
import prisma from "@/lib/db";
import styles from "./catalogue.module.css";
import CatalogueClient from "./CatalogueClient";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Card Catalogue — MemoryMint",
  description:
    "Browse our collection of pre-designed greeting cards. Choose a design, add your personal photo and message, and download a print-ready PDF.",
};

export default async function CataloguePage() {
  const cards = await prisma.designedCard.findMany({
    where: { is_active: true },
    orderBy: { sort_order: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      preview_thumbnail_url: true,
      description: true,
    },
  });

  return (
    <div className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <Logo height={85} />
        <Link href="/create" className="btn-secondary" style={{ fontSize: "0.9rem" }}>
          Create a Custom Card
        </Link>
      </nav>

      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Browse the Card Catalogue</h1>
        <p className={styles.subtitle}>
          Choose a design you love. Add your photo and personal message. Download a
          print-ready&nbsp;PDF — ready to fold and deliver.
        </p>
      </header>

      {/* Interactive filter + grid (client component) */}
      <CatalogueClient cards={cards} />
    </div>
  );
}
