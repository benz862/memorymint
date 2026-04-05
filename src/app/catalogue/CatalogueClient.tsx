"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import styles from "./catalogue.module.css";

interface Card {
  id: string;
  name: string;
  slug: string;
  category: string;
  preview_thumbnail_url: string;
  description: string | null;
}

interface Props {
  cards: Card[];
}

/** Extract the collection name from a card name, e.g. "Grumpy Birthday #05" → "Grumpy Birthday" */
function collectionOf(name: string): string {
  return name.replace(/\s*#\d+$/, '').trim();
}

export default function CatalogueClient({ cards }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeCollection, setActiveCollection] = useState<string>("all");

  // Unique categories from DB
  const categories = useMemo(
    () => ["all", ...Array.from(new Set(cards.map((c) => c.category))).sort()],
    [cards]
  );

  // Collections within the active category
  const collections = useMemo(() => {
    const inCategory = activeCategory === "all" ? cards : cards.filter((c) => c.category === activeCategory);
    const names = Array.from(new Set(inCategory.map((c) => collectionOf(c.name)))).sort();
    return names.length > 1 ? ["all", ...names] : [];
  }, [cards, activeCategory]);

  // Reset collection filter when category changes
  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setActiveCollection("all");
  };

  // Filtered cards
  const filtered = useMemo(() => {
    let result = cards;
    if (activeCategory !== "all") result = result.filter((c) => c.category === activeCategory);
    if (activeCollection !== "all") result = result.filter((c) => collectionOf(c.name) === activeCollection);
    return result;
  }, [cards, activeCategory, activeCollection]);

  const label = (s: string) =>
    s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ");

  return (
    <>
      {/* Category tabs */}
      <div className={styles.filters}>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`${styles.filterBtn} ${activeCategory === cat ? styles.filterBtnActive : ""}`}
            onClick={() => handleCategoryChange(cat)}
          >
            {label(cat)}
            {cat !== "all" && (
              <span className={styles.filterCount}>
                {cards.filter((c) => c.category === cat).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Collection sub-tabs (only when a category with multiple collections is selected) */}
      {collections.length > 0 && (
        <div className={styles.subFilters}>
          {collections.map((col) => (
            <button
              key={col}
              className={`${styles.subFilterBtn} ${activeCollection === col ? styles.subFilterBtnActive : ""}`}
              onClick={() => setActiveCollection(col)}
            >
              {label(col)}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      <p className={styles.resultsCount}>
        {filtered.length} design{filtered.length !== 1 ? "s" : ""}
        {activeCollection !== "all" ? ` in ${activeCollection}` : activeCategory !== "all" ? ` in ${label(activeCategory)}` : " total"}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className={styles.empty}>No cards match this filter.</p>
      ) : (
        <div className={styles.grid}>
          {filtered.map((card) => (
            // Use a plain <a> (not Next.js Link) so every click is a full page
            // navigation — prevents the Router Cache serving the wrong card.
            <a key={card.id} href={`/catalogue/${card.slug}`} className={styles.cardTile}>
              <div className={styles.cardThumbnail}>
                <Image
                  src={card.preview_thumbnail_url}
                  alt={card.name}
                  fill
                  sizes="(max-width: 580px) 100vw, (max-width: 900px) 50vw, 33vw"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className={styles.cardTileBody}>
                <span className={styles.categoryBadge}>{collectionOf(card.name)}</span>
                <div className={styles.cardName}>{card.name}</div>
                {card.description && <p className={styles.cardDesc}>{card.description}</p>}
                <span className={styles.cardCta}>Personalise This Card →</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
