"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PRICING } from "@/lib/constants";
import PhotoEditor, { type CaptionStyle } from "@/components/PhotoEditor";
import styles from "./customize.module.css";

// Google Fonts for live preview
const FONT_GOOGLE_URLS: Record<string, string> = {
  "Dancing Script":
    "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600&display=swap",
  "Playfair Display":
    "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap",
  Inter: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap",
};

export default function CustomizeForm({
  projectId,
  templates,
  fonts,
  initialSize,
  initialTemplateId,
  initialFontId,
  initialMessage,
  recipientName,
  senderName,
}: {
  projectId: string;
  templates: any[];
  fonts: any[];
  initialSize: string;
  initialTemplateId: string | null;
  initialFontId: string | null;
  initialMessage: string;
  recipientName: string;
  senderName: string;
}) {
  const router = useRouter();

  const [size, setSize] = useState(initialSize || "5x7");
  const [fontId, setFontId] = useState(initialFontId || fonts[0]?.id || "");
  const [isSaving, setIsSaving] = useState(false);

  // Photo / editor state
  type PhotoStage = "idle" | "editing" | "done";
  const [photoStage, setPhotoStage] = useState<PhotoStage>("idle");
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [croppedDataUrl, setCroppedDataUrl] = useState<string | null>(null);
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const selectedFont = fonts.find((f) => f.id === fontId);
  const cardFontFamily = selectedFont
    ? `'${selectedFont.font_family}', serif`
    : "Georgia, serif";
  const googleFontUrl = selectedFont ? FONT_GOOGLE_URLS[selectedFont.font_family] : null;

  // ── Photo handling ─────────────────────────────────────────
  const handleFile = useCallback((file: File | null) => {
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      alert("Please upload a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be under 10MB.");
      return;
    }
    // Convert File to data URL for PhotoEditor
    const reader = new FileReader();
    reader.onload = (e) => {
      setRawImageSrc(e.target?.result as string);
      setPhotoStage("editing");
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFile(e.dataTransfer.files?.[0] || null);
    },
    [handleFile]
  );

  // Called by PhotoEditor when user clicks "Apply & Continue"
  const handlePhotoConfirm = useCallback(
    (cropped: string, caption: CaptionStyle) => {
      setCroppedDataUrl(cropped);
      setCaptionStyle(caption);
      setPhotoStage("done");
    },
    []
  );

  // ── Save & go to preview ───────────────────────────────────
  const handlePreview = async () => {
    setIsSaving(true);
    try {
      let photoUrl: string | null = null;
      let captionJson: string | null = null;

      if (croppedDataUrl) {
        const blob = await (await fetch(croppedDataUrl)).blob();
        const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const d = await uploadRes.json();
          photoUrl = d.url;
        }
        // frameStyle is now part of captionStyle (set inside PhotoEditor)
        if (captionStyle) captionJson = JSON.stringify(captionStyle);
      }

      const res = await fetch(`/api/project/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected_size: size,
          selected_template_id: templates[0]?.id || null,
          selected_font_id: fontId,
          ...(photoUrl ? { inside_photo_url: photoUrl } : {}),
          ...(captionJson ? { inside_photo_caption: captionJson } : {}),
          status: "customized",
        }),
      });

      if (res.ok) {
        router.push(`/preview/${projectId}`);
      } else {
        throw new Error("Save failed");
      }
    } catch (e: any) {
      alert("Error saving: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const price = PRICING[size as keyof typeof PRICING]?.price ?? 5.99;

  // ── If in photo editor mode, show full-width editor ────────
  if (photoStage === "editing" && rawImageSrc) {
    return (
      <div className={styles.editorWrapper}>
        <button className={styles.editorBack} onClick={() => setPhotoStage("idle")}>
          ← Cancel photo
        </button>
        <PhotoEditor
          imageSrc={rawImageSrc}
          onConfirm={handlePhotoConfirm}
          onCancel={() => setPhotoStage("idle")}
        />
      </div>
    );
  }

  return (
    <>
      {googleFontUrl && <link rel="stylesheet" href={googleFontUrl} />}

      <div className={styles.layout}>
        {/* ── LEFT: Live Card Preview ────────────────────────── */}
        <div className={styles.previewCol}>
          <div className={styles.previewLabel}>Your Card Preview</div>

          <div className={styles.cardMockup}>
            {/* Inside-left panel */}
            <div className={styles.cardPanel} style={{ borderRight: "1px solid #e8e0da" }}>
              {croppedDataUrl ? (
                <>
                  {/* Frame-aware preview — mirrors the choice made in PhotoEditor */}
                  {(() => {
                    const fs = captionStyle?.frameStyle ?? "polaroid";
                    // All frames live inside a padded wrapper so they don't fill edge-to-edge
                    const imgEl = (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={croppedDataUrl} alt="Your photo" style={{ display: "block", width: "100%", objectFit: "cover" }} />
                    );
                    const captionEl = captionStyle?.text ? (
                      <div style={{
                        fontFamily: captionStyle.fontFamily,
                        fontSize: `${captionStyle.fontSize * 0.85}px`,
                        color: captionStyle.color,
                        textAlign: captionStyle.align as any,
                        fontWeight: captionStyle.bold ? 700 : 400,
                        fontStyle: captionStyle.italic ? "italic" : "normal",
                        marginTop: "4px",
                        padding: "0 2px",
                        wordBreak: "break-word",
                        lineHeight: 1.3,
                      }}>{captionStyle.text}</div>
                    ) : null;

                    const inner = (() => {
                      if (fs === "classic") return (
                        <div>
                          <div style={{ border: "3px solid #111", boxShadow: "4px 4px 0 rgba(0,0,0,0.22)" }}>{imgEl}</div>
                          {captionEl}
                        </div>
                      );
                      if (fs === "square") return (
                        <div>
                          <div style={{ border: "2px solid #1a1a1a", boxShadow: "4px 4px 0 rgba(0,0,0,0.22)", aspectRatio: "1/1", overflow: "hidden" }}>{imgEl}</div>
                          {captionEl}
                        </div>
                      );
                      if (fs === "float") return (
                        <div>
                          <div style={{ boxShadow: "5px 5px 0 rgba(0,0,0,0.18)" }}>{imgEl}</div>
                          {captionEl}
                        </div>
                      );
                      if (fs === "naked") return (
                        <div>
                          {imgEl}
                          {captionEl}
                        </div>
                      );
                      // polaroid (default)
                      return (
                        <div className={styles.polaroidInPreview}>
                          {imgEl}
                          {captionEl}
                        </div>
                      );
                    })();

                    return <div style={{ padding: "0 12px", width: "100%" }}>{inner}</div>;
                  })()}
                  <button className={styles.changePhotoBtn} onClick={() => setPhotoStage("editing")}>
                    ✏️ Edit photo
                  </button>
                </>
              ) : (
                <div
                  className={styles.photoPlaceholder}
                  onClick={() => document.getElementById("photo-input")?.click()}
                >
                  <span className={styles.photoPlaceholderIcon}>📷</span>
                  <span className={styles.photoPlaceholderText}>Tap to add photo</span>
                </div>
              )}
            </div>

            {/* Inside-right panel: message */}
            <div className={styles.cardPanel}>
              <div
                className={styles.cardMessageText}
                style={{ fontFamily: cardFontFamily }}
              >
                {initialMessage || "Your message will appear here…"}
              </div>
              <div className={styles.cardSignature} style={{ fontFamily: cardFontFamily }}>
                — {senderName || "You"}
              </div>
            </div>
          </div>

          <p className={styles.previewNote}>
            🔒 Front &amp; back printed with your chosen card design · Inside shown above
          </p>
        </div>

        {/* ── RIGHT: Options ─────────────────────────────────── */}
        <div className={styles.optionsCol}>

          {/* 1. Photo */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              1. Add a Photo <span className={styles.optional}>(Optional)</span>
            </h2>
            <p className={styles.sectionHint}>
              Printed Polaroid-style on the inside left. You can crop, zoom, and add a caption.
            </p>

            {croppedDataUrl ? (
              <div className={styles.photoDoneRow}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={croppedDataUrl} alt="Cropped" className={styles.uploadThumb} />
                <div>
                  <button className={styles.btnEditPhoto} onClick={() => setPhotoStage("editing")}>
                    ✏️ Edit / re-crop
                  </button>
                  <button
                    className={styles.removePhotoBtn}
                    onClick={() => { setCroppedDataUrl(null); setCaptionStyle(null); setPhotoStage("idle"); setRawImageSrc(null); }}
                  >
                    ✕ Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                id="photo-drop-zone"
                className={`${styles.uploadZone} ${isDragging ? styles.dragOver : ""}`}
                onClick={() => document.getElementById("photo-input")?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                role="button"
                aria-label="Upload photo"
              >
                <span className={styles.uploadIcon}>📷</span>
                <span className={styles.uploadLabel}>Drag &amp; drop or click to browse</span>
                <span className={styles.uploadHint}>JPEG · PNG · WebP · Max 10MB</span>
              </div>
            )}

            <input
              id="photo-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
            />
          </section>

          {/* 2. Font */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. Message Font</h2>
            <p className={styles.sectionHint}>Updates live in the preview.</p>
            <div className={styles.fontGrid}>
              {fonts.map((f) => (
                <button
                  key={f.id}
                  id={`font-${f.slug}`}
                  className={`${styles.fontCard} ${fontId === f.id ? styles.fontCardActive : ""}`}
                  onClick={() => setFontId(f.id)}
                >
                  <span
                    className={styles.fontSample}
                    style={{ fontFamily: `'${f.font_family}', serif` }}
                  >
                    Aa
                  </span>
                  <span className={styles.fontName}>{f.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* 3. Size */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. Card Size</h2>
            <div className={styles.sizeGrid}>
              {Object.values(PRICING).map((p) => (
                <button
                  key={p.size}
                  id={`size-${p.size}`}
                  className={`${styles.sizeCard} ${size === p.size ? styles.sizeCardActive : ""}`}
                  onClick={() => setSize(p.size)}
                >
                  <span className={styles.sizeLabel}>{p.label}</span>
                  <span className={styles.sizePrice}>${p.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className={styles.cta}>
            <button
              id="preview-btn"
              className={styles.btnNext}
              onClick={handlePreview}
              disabled={isSaving || !fontId}
            >
              {isSaving ? "Saving…" : `Preview & Checkout — $${price.toFixed(2)}`}
            </button>
            <button
              className={styles.btnBack}
              onClick={() => router.push(`/choose-card/${projectId}`)}
            >
              ← Change Card Design
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
