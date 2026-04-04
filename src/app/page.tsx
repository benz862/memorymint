import Link from "next/link";
import styles from "./page.module.css";
import { Sparkles, FileText, Heart, Images } from "lucide-react";
import prisma from "@/lib/db";
import Logo from "@/components/Logo";
import CatalogueRotator from "@/components/CatalogueRotator";

/** Fisher-Yates shuffle (server-side, runs fresh each request) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function Home() {
  // Fetch a larger pool and shuffle so the rotator starts at a random point every load
  const allPreviewCards = await prisma.designedCard.findMany({
    where: { is_active: true },
    select: { id: true, name: true, slug: true, preview_thumbnail_url: true },
  });
  const cataloguePool = shuffle(allPreviewCards);

  return (
    <>
      <nav className={styles.nav}>
        <Logo height={85} />
        <div>
          <Link href="/create" className="btn-primary">
            Create Your Card
          </Link>
        </div>
      </nav>

      <main>
        <section className={styles.hero}>
          <h1 className={styles.title}>
            Turn your memories into a card worth keeping.
          </h1>
          <p className={styles.subtitle}>
            Enter the moments, memories, and feelings that matter most. We’ll help
            shape them into a heartfelt message and place it inside a beautiful,
            print-ready card.
          </p>
          <div className={styles.actions}>
            <Link href="/create" className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              Create My Card
            </Link>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <Heart color="var(--primary)" size={32} />
              </div>
              <h3 className={styles.featureTitle}>Guided by You</h3>
              <p className={styles.featureDesc}>
                Answer a few questions about your favorite moments. We never invent facts—only beautifully structure yours.
              </p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <Sparkles color="var(--primary)" size={32} />
              </div>
              <h3 className={styles.featureTitle}>AI-Crafted Message</h3>
              <p className={styles.featureDesc}>
                Our engine carefully forms a heartfelt, intimate message perfectly tailored to the feelings you want to share.
              </p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <FileText color="var(--primary)" size={32} />
              </div>
              <h3 className={styles.featureTitle}>Elegant Design</h3>
              <p className={styles.featureDesc}>
                Select from beautiful romantic templates and handwritten fonts. You can even upload your favorite photo.
              </p>
            </div>
          </div>
        </section>

        {/* ── Free message callout ─────────────────────────── */}
        <section className={styles.freeCallout}>
          <div className={styles.freeCalloutInner}>
            <span className={styles.freeCalloutBadge}>100% Free</span>
            <h2 className={styles.freeCalloutTitle}>Writing your message costs nothing.</h2>
            <p className={styles.freeCalloutBody}>
              Craft the perfect heartfelt message — guided by your memories — completely free, no card
              required. Only when you love what you see and want to place it inside a beautifully
              designed card do you pay. Simple as that.
            </p>
          </div>
        </section>

        {/* ── Catalogue Promo ────────────────────────────── */}
        <section className={styles.catalogueSection}>
          <h2 className={styles.catalogueSectionTitle}>Love a card we&apos;ve already designed?</h2>
          <p className={styles.catalogueSectionSub}>
            Browse our collection of pre-designed cards. Choose one you love, add your own inside
            photo and personal message, and download a print-ready PDF — all four panels,
            ready to fold.
          </p>

          {cataloguePool.length > 0 && (
            <CatalogueRotator cards={cataloguePool} perPage={3} />
          )}

          <Link href="/catalogue" className="btn-primary" style={{ padding: "0.85rem 2rem" }}>
            <Images size={16} style={{ marginRight: "0.5rem" }} />
            Browse All Cards
          </Link>
        </section>

        <section className={styles.pricing}>

          <h2 className={styles.title} style={{ fontSize: '2.5rem' }}>Simple, Honest Pricing</h2>
          <p className={styles.subtitle}>
            Writing &amp; personalizing your message is always free. Pay only when you&apos;re ready
            to download a print-ready card PDF.
          </p>

          <div className={styles.pricingCards}>
            <div className={styles.pricingCard}>
              <h3 className={styles.priceTitle}>4x6 Card</h3>
              <div className={styles.priceAmount}>$3.99</div>
              <p style={{ color: 'var(--muted-foreground)', marginBottom: '2rem' }}>
                Print-ready PDF formatted for standard 4x6 greeting card size.
              </p>
              <Link href="/create" className="btn-secondary" style={{ width: '100%' }}>
                Start Creating
              </Link>
            </div>
            
            <div className={styles.pricingCard}>
              <h3 className={styles.priceTitle}>5x7 Card</h3>
              <div className={styles.priceAmount}>$5.99</div>
              <p style={{ color: 'var(--muted-foreground)', marginBottom: '2rem' }}>
                Print-ready PDF formatted for premium 5x7 greeting card size.
              </p>
              <Link href="/create" className="btn-primary" style={{ width: '100%' }}>
                Start Creating
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}><Logo height={85} linked={false} /></div>
        <p>&copy; {new Date().getFullYear()} MemoryMint. All rights reserved.</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Designed for moments that matter.</p>
      </footer>
    </>
  );
}
