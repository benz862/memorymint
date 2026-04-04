"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import styles from "../catalogue.module.css";
import PhotoEditor, { CaptionStyle, DEFAULT_CAPTION_STYLE } from "@/components/PhotoEditor";

interface DesignedCard {
  id: string;
  name: string;
  slug: string;
  category: string;
  front_image_url: string;
  back_image_url: string;
  description?: string | null;
}

interface CardConfiguratorProps {
  card: DesignedCard;
}

type Step = 1 | 2 | 3;
// Sub-state within Step 1
type PhotoStage = "upload" | "editing" | "confirmed";

const SIZES = [
  { value: "4x6", label: "4×6", price: "$3.99", dims: '4" × 6"' },
  { value: "5x7", label: "5×7", price: "$5.99", dims: '5" × 7"' },
];

export default function CardConfigurator({ card }: CardConfiguratorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [photoStage, setPhotoStage] = useState<PhotoStage>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // Photo state
  const [rawPhotoSrc, setRawPhotoSrc] = useState<string | null>(null);    // original full-res data URL
  const [croppedPhotoSrc, setCroppedPhotoSrc] = useState<string | null>(null); // post-crop data URL shown to user
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>(DEFAULT_CAPTION_STYLE);

  // Step 2 state
  const [message, setMessage] = useState("");
  const [selectedSize, setSelectedSize] = useState("5x7");
  const [isBlankInside, setIsBlankInside] = useState(false);

  // ── Photo file handling ───────────────────────────────────
  const handleFileChange = useCallback((file: File | null) => {
    if (!file) return;
    const accepted = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!accepted.includes(file.type)) {
      alert("Please upload a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Please keep your image under 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setRawPhotoSrc(e.target?.result as string);
      setCroppedPhotoSrc(null);
      setCaptionStyle(DEFAULT_CAPTION_STYLE);
      setPhotoStage("editing"); // go straight to editor
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileChange(e.dataTransfer.files?.[0] || null);
    },
    [handleFileChange]
  );

  // Called by PhotoEditor when user clicks "Apply & Continue"
  const handleEditorConfirm = useCallback(
    (croppedUrl: string, cs: CaptionStyle) => {
      setCroppedPhotoSrc(croppedUrl);
      setCaptionStyle(cs);
      setPhotoStage("confirmed");
    },
    []
  );

  // Upload the cropped image (data URL → blob → server)
  const uploadCroppedPhoto = async (): Promise<string | null> => {
    if (!croppedPhotoSrc) return null;

    // Convert data URL to blob
    const res = await fetch(croppedPhotoSrc);
    const blob = await res.blob();
    const file = new File([blob], "photo.jpg", { type: "image/jpeg" });

    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
    if (!uploadRes.ok) {
      const err = await uploadRes.json();
      throw new Error(err.error || "Upload failed");
    }
    const data = await uploadRes.json();
    return data.url;
  };

  // ── Step navigation ───────────────────────────────────────
  const goToStep2 = () => setStep(2);

  const goToStep3 = async () => {
    if (!isBlankInside && !message.trim()) {
      alert("Please write your message, or choose \"Leave inside blank\" for handwriting.");
      return;
    }
    setIsSubmitting(true);
    try {
      let uploadedPhotoUrl: string | null = null;
      if (croppedPhotoSrc) {
        uploadedPhotoUrl = await uploadCroppedPhoto();
      }

      // Serialize caption style as JSON for storage
      const captionJson = croppedPhotoSrc
        ? JSON.stringify(captionStyle)
        : null;

      const res = await fetch("/api/designed-card/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designedCardId: card.id,
          insidePhotoUrl: uploadedPhotoUrl,
          insidePhotoCaption: captionJson,
          insideMessage: isBlankInside ? "" : message.trim(),
          selectedSize,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Could not create order");
      }

      const data = await res.json();
      setPdfPreviewUrl(`/api/pdf/designed/${data.orderId}`);
      setStep(3);
    } catch (err: any) {
      alert(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    if (!pdfPreviewUrl) return;
    const orderId = pdfPreviewUrl.split("/").pop();
    if (!orderId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/checkout/designed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Checkout failed");
      }
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      alert(err.message || "Checkout error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSizeData = SIZES.find((s) => s.value === selectedSize)!;

  // ── Step 1A — Upload Zone (no photo yet) ─────────────────
  const renderUploadZone = () => (
    <div>
      <div className={styles.stepIndicator}>
        <span>Step 1 of 3</span>
        <span>Your Photo (Optional)</span>
      </div>
      <h2 className={styles.stepTitle}>Add a personal photo</h2>
      <p style={{ fontSize: "0.88rem", color: "var(--muted-foreground)", marginBottom: "1rem" }}>
        Your photo prints on the inside-left panel, Polaroid-style with your caption below it.
      </p>

      <div
        id="photo-upload-zone"
        className={`${styles.uploadZone} ${isDragging ? styles.dragOver : ""}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        role="button"
        aria-label="Upload photo"
      >
        <div className={styles.uploadIcon}>📷</div>
        <p className={styles.uploadLabel}>Drag & drop a photo here, or click to browse</p>
        <p className={styles.uploadHint}>JPEG, PNG or WebP · Max 10MB</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        id="photo-file-input"
        aria-label="Photo file input"
      />

      <div className={styles.actions} style={{ marginTop: "1.5rem" }}>
        <div />
        <button className={styles.btnNext} onClick={goToStep2} id="skip-photo-btn">
          Skip — no photo →
        </button>
      </div>
    </div>
  );

  // ── Step 1B — Photo Editor ────────────────────────────────
  const renderEditor = () => (
    <div>
      <div className={styles.stepIndicator}>
        <span>Step 1 of 3</span>
        <span>Crop & Style</span>
      </div>
      <h2 className={styles.stepTitle}>Edit your photo</h2>
      <PhotoEditor
        imageSrc={rawPhotoSrc!}
        initialCaption={captionStyle}
        onConfirm={handleEditorConfirm}
        onCancel={() => {
          setPhotoStage("upload");
          setRawPhotoSrc(null);
        }}
      />
    </div>
  );

  // ── Step 1C — Confirmed photo summary ────────────────────
  const renderConfirmed = () => {
    const captionText = captionStyle.text;
    return (
      <div>
        <div className={styles.stepIndicator}>
          <span>Step 1 of 3</span>
          <span>Photo Ready ✓</span>
        </div>
        <h2 className={styles.stepTitle}>Photo &amp; caption set</h2>

        {/* Confirmed thumbnail row */}
        <div className={styles.confirmedPhotoRow}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={croppedPhotoSrc!}
            alt="Your cropped photo"
            className={styles.confirmedPhotoThumb}
          />
          <div className={styles.confirmedPhotoInfo}>
            <strong>Photo added</strong>
            {captionText && (
              <div className={styles.confirmedPhotoCaptionPreview}>
                Caption: &ldquo;{captionText}&rdquo;
              </div>
            )}
            <div style={{ fontSize: "0.76rem", marginTop: "0.2rem", color: "var(--muted-foreground)" }}>
              {captionStyle.fontFamily.split(",")[0]} ·{" "}
              {captionStyle.fontSize}pt ·{" "}
              <span style={{ color: captionStyle.color }}>■</span>{" "}
              {captionStyle.align}
            </div>
          </div>
          <button
            className={styles.confirmedPhotoEdit}
            onClick={() => setPhotoStage("editing")}
            id="re-edit-photo-btn"
          >
            ✏️ Edit
          </button>
        </div>

        {/* Option to remove photo */}
        <button
          className={styles.uploadZoneCompact}
          onClick={() => { setPhotoStage("upload"); setRawPhotoSrc(null); setCroppedPhotoSrc(null); }}
          style={{ width: "100%", marginBottom: "1rem" }}
        >
          📷 Change or remove photo
        </button>

        <div className={styles.actions}>
          <div />
          <button className={styles.btnNext} onClick={goToStep2} id="step1-next-btn">
            Continue →
          </button>
        </div>
      </div>
    );
  };

  // ── Step 2 — Message + Size ───────────────────────────────
  const renderStep2 = () => (
    <div>
      <div className={styles.stepIndicator}>
        <span>Step 2 of 3</span>
        <span>Your Message &amp; Size</span>
      </div>
      <h2 className={styles.stepTitle}>Write your message</h2>

      {/* Blank inside toggle */}
      <label
        htmlFor="blank-inside-toggle"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          padding: "0.75rem 1rem",
          borderRadius: "var(--radius-md)",
          border: `1.5px solid ${isBlankInside ? "var(--mint)" : "var(--border)"}`,
          background: isBlankInside ? "var(--muted)" : "transparent",
          cursor: "pointer",
          marginBottom: "1.25rem",
          transition: "all 0.2s ease",
          fontSize: "0.9rem",
          fontWeight: 500,
        }}
      >
        <input
          id="blank-inside-toggle"
          type="checkbox"
          checked={isBlankInside}
          onChange={(e) => setIsBlankInside(e.target.checked)}
          style={{ accentColor: "var(--mint)", width: "1.1rem", height: "1.1rem" }}
        />
        ✍️ Leave inside blank — I&apos;ll handwrite my message
        <span style={{ fontSize: "0.78rem", color: "var(--muted-foreground)", fontWeight: 400, marginLeft: "auto" }}>
          Inside prints blank
        </span>
      </label>

      {!isBlankInside && (
        <div className={styles.formGroup}>
          <label htmlFor="inside-message">
            Inside-right message{" "}
            <span style={{ fontWeight: 400, color: "var(--muted-foreground)" }}>
              ({message.length} chars)
            </span>
          </label>
          <textarea
            id="inside-message"
            className={styles.textarea}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your personal message here. This will be printed on the inside right of the card..."
            rows={7}
          />
        </div>
      )}

      {isBlankInside && (
        <div style={{
          padding: "1.25rem",
          background: "var(--muted)",
          borderRadius: "var(--radius-md)",
          border: "1.5px dashed var(--mint-soft)",
          textAlign: "center",
          color: "var(--muted-foreground)",
          fontSize: "0.88rem",
          marginBottom: "1rem",
        }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>✍️</div>
          The inside right panel will be printed <strong>blank</strong>.<br />
          Plenty of room for your own handwriting.
        </div>
      )}

      <div className={styles.formGroup} style={{ marginTop: "1.5rem" }}>
        <label>Card Size</label>
        <div className={styles.sizeOptions}>
          {SIZES.map((s) => (
            <button
              key={s.value}
              id={`size-${s.value}`}
              className={`${styles.sizeOption} ${selectedSize === s.value ? styles.sizeOptionSelected : ""}`}
              onClick={() => setSelectedSize(s.value)}
            >
              <div className={styles.sizeName}>{s.label}</div>
              <div className={styles.sizePrice}>{s.price}</div>
              <div className={styles.sizeDims}>{s.dims}</div>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.btnBack} onClick={() => setStep(1)} id="step2-back-btn">
          ← Back
        </button>
        <button
          className={styles.btnNext}
          onClick={goToStep3}
          disabled={isSubmitting || (!isBlankInside && !message.trim())}
          id="step2-next-btn"
        >
          {isSubmitting ? "Generating Preview…" : "Preview My Card →"}
        </button>
      </div>
    </div>
  );

  // ── Step 3 — Preview & Checkout ───────────────────────────
  const renderStep3 = () => (
    <div>
      <div className={styles.stepIndicator}>
        <span>Step 3 of 3</span>
        <span>Preview &amp; Download</span>
      </div>
      <h2 className={styles.stepTitle}>Your card preview</h2>

      <p style={{ fontSize: "0.88rem", color: "var(--muted-foreground)", marginBottom: "1rem" }}>
        This watermarked preview shows your complete 4-panel layout. Purchase to download the clean,
        print-ready PDF.
      </p>

      {pdfPreviewUrl && (
        <div className={styles.pdfPreview}>
          <iframe src={pdfPreviewUrl} title="Card Preview" />
        </div>
      )}

      <div className={styles.checkoutSummary} style={{ marginTop: "1.5rem" }}>
        <div className={styles.summaryRow}>
          <span>Card Design</span>
          <span>{card.name}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Size</span>
          <span>{selectedSizeData.label} ({selectedSizeData.dims})</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Photo &amp; caption</span>
          <span>{croppedPhotoSrc ? "Yes" : "No"}</span>
        </div>
        <div className={styles.totalRow}>
          <span>Total</span>
          <span>{selectedSizeData.price}</span>
        </div>
      </div>

      <button
        id="checkout-btn"
        className={styles.btnNext}
        style={{ width: "100%", padding: "0.9rem", fontSize: "1rem" }}
        onClick={handleCheckout}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Redirecting to Checkout…" : `Purchase & Download — ${selectedSizeData.price}`}
      </button>

      <button
        className={styles.btnBack}
        style={{ width: "100%", marginTop: "0.75rem", textAlign: "center" }}
        onClick={() => setStep(2)}
        id="step3-back-btn"
      >
        ← Edit Message or Size
      </button>
    </div>
  );

  // When the editor is open, go full-width (no left column)
  const isEditorOpen = step === 1 && photoStage === "editing";

  return (
    <>
      {/* Google Fonts for caption font options */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Dancing+Script:wght@400;600&family=Inter:wght@400;500&display=swap"
      />

      {isEditorOpen ? (
        // Full-width editor layout
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 2rem 5rem" }}>
          <div className={styles.wizard} style={{ padding: 0 }}>
            {renderEditor()}
          </div>
        </div>
      ) : (
        <div className={styles.configuratorLayout}>
          {/* Left — Card preview (sticky) */}
          <div className={styles.cardPreviewSticky}>
            <Image
              src={card.front_image_url}
              alt={`${card.name} front`}
              width={400}
              height={560}
              className={styles.cardPreviewImage}
              priority
            />

            {/* When photo is confirmed, show polaroid preview in left column */}
            {step === 1 && photoStage === "confirmed" && croppedPhotoSrc && (
              <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                <div
                  style={{
                    display: "inline-block",
                    background: "#fff",
                    padding: "8px",
                    paddingBottom: "36px",
                    boxShadow: "0 6px 24px rgba(0,0,0,0.15)",
                    borderRadius: "2px",
                    maxWidth: "220px",
                    width: "100%",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={croppedPhotoSrc}
                    alt="Polaroid preview"
                    style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }}
                  />
                  {captionStyle.text && (
                    <div
                      style={{
                        fontFamily: captionStyle.fontFamily,
                        fontSize: `${captionStyle.fontSize}px`,
                        color: captionStyle.color,
                        textAlign: captionStyle.align,
                        fontWeight: captionStyle.bold ? "bold" : "normal",
                        fontStyle: captionStyle.italic ? "italic" : "normal",
                        marginTop: "6px",
                        padding: "0 4px",
                        wordBreak: "break-word",
                        lineHeight: 1.4,
                      }}
                    >
                      {captionStyle.text}
                    </div>
                  )}
                </div>
                <p style={{ fontSize: "0.72rem", color: "var(--muted-foreground)", marginTop: "0.5rem" }}>
                  Inside-left preview
                </p>
              </div>
            )}

            <div className={styles.lockedBadge}>
              <span>🔒</span>
              <span>Front &amp; back designed by the artist.</span>
            </div>
          </div>

          {/* Right — Step wizard */}
          <div className={styles.wizard}>
            {step === 1 && photoStage === "upload" && renderUploadZone()}
            {step === 1 && photoStage === "confirmed" && renderConfirmed()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </div>
        </div>
      )}
    </>
  );
}
