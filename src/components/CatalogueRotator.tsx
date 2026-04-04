"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "@/app/page.module.css";

interface Card {
  id: string;
  name: string;
  slug: string;
  preview_thumbnail_url: string;
}

interface Props {
  cards: Card[];
  perPage?: number;
}

export default function CatalogueRotator({ cards, perPage = 3 }: Props) {
  const [offset, setOffset] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (cards.length <= perPage) return;
    const id = setInterval(() => {
      // Fade out → update → fade in
      setVisible(false);
      setTimeout(() => {
        setOffset((prev) => (prev + perPage) % cards.length);
        setVisible(true);
      }, 350); // matches CSS transition duration
    }, 3500);
    return () => clearInterval(id);
  }, [cards.length, perPage]);

  // Pick the current slice (wraps around)
  const shown = Array.from({ length: perPage }, (_, i) => cards[(offset + i) % cards.length]);

  return (
    <div
      className={styles.cataloguePreviewGrid}
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.35s ease",
      }}
    >
      {shown.map((card) => (
        <Link
          key={`${card.id}-${offset}`}
          href={`/catalogue/${card.slug}`}
          className={styles.cataloguePreviewTile}
        >
          <Image
            src={card.preview_thumbnail_url}
            alt={card.name}
            width={160}
            height={224}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
          <div className={styles.catalogueTileName}>{card.name}</div>
        </Link>
      ))}
    </div>
  );
}
