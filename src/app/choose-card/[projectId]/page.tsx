export const dynamic = "force-dynamic";

import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./choosecardpage.module.css";

/** Maps occasion subtype slugs → designed card categories */
function occasionToCategory(occasionSlug: string): string {
  const birthdayOccasions = [
    "happy-birthday", "milestone-birthday", "kids-birthday",
    "funny-birthday", "belated-birthday",
  ];
  if (birthdayOccasions.includes(occasionSlug)) return "birthday";
  // valentines, anniversary, just-because, i-miss-you, apology → anniversary/romantic cards
  return "anniversary";
}

const categoryLabels: Record<string, string> = {
  birthday: "🎂 Birthday",
  anniversary: "💍 Anniversary & Romance",
  general: "💌 General",
};

export default async function ChooseCardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const project = await prisma.cardProject.findUnique({
    where: { id: projectId },
    include: { occasion_subtype: true },
  });
  if (!project) notFound();

  const suggestedCategory = occasionToCategory(project.occasion_subtype.slug);
  const occasionLabel = project.occasion_subtype.name;

  // Only load cards that match this occasion — no full catalogue dump
  const matchedCards = await prisma.designedCard.findMany({
    where: { is_active: true, category: suggestedCategory },
    orderBy: { sort_order: "asc" },
  });

  return (
    <div className={styles.page}>
      <div className={styles.back}>
        <Link href={`/draft/${projectId}`} className={styles.backLink}>
          ← Back to message
        </Link>
      </div>

      <header className={styles.header}>
        <h1 className={styles.title}>Choose Your Card Design</h1>
        <p className={styles.subtitle}>
          Designs matched to your <strong>{occasionLabel}</strong> message.
          Your words go on the inside — just pick a front you love.
        </p>
      </header>

      {matchedCards.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--muted-foreground)" }}>
          <p>No designs found for this occasion yet.</p>
          <Link href="/catalogue" className="btn-secondary" style={{ marginTop: "1.5rem", display: "inline-flex" }}>
            Browse All Designs
          </Link>
        </div>
      ) : (
        <>
          <section className={styles.categorySection}>
            <div className={styles.categoryHeader}>
              <h2 className={styles.categoryLabel}>
                {categoryLabels[suggestedCategory] ?? suggestedCategory}
              </h2>
              <span className={styles.recommendedBadge}>
                ✨ Matched to your &ldquo;{occasionLabel}&rdquo; message
              </span>
            </div>
            <div className={styles.grid}>
              {matchedCards.map((card) => (
                <Link
                  key={card.id}
                  href={`/choose-card/${projectId}/select?cardId=${card.id}`}
                  className={styles.cardLink}
                >
                  <div className={styles.cardItem}>
                    <div className={styles.cardImageWrap}>
                      <Image
                        src={card.preview_thumbnail_url}
                        alt={card.name}
                        fill
                        sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 20vw"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <div className={styles.cardInfo}>
                      <div className={styles.cardName}>{card.name}</div>
                      {card.description && (
                        <p className={styles.cardDesc}>{card.description}</p>
                      )}
                      <div className={styles.selectBtn}>Use This Design →</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <div style={{ textAlign: "center", padding: "2rem 0 3rem", borderTop: "1px solid var(--border)", marginTop: "2rem" }}>
            <p style={{ color: "var(--muted-foreground)", marginBottom: "1rem", fontSize: "0.9rem" }}>
              Looking for something different?
            </p>
            <Link href="/catalogue" className="btn-secondary">
              Browse All Designs
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
