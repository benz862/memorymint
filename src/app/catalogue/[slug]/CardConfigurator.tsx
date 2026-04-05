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
type PhotoStage = "upload" | "editing" | "confirmed";
type FrameStyle = "polaroid" | "classic" | "square" | "float" | "naked";

const SIZES = [
  { value: "4x6", label: "4×6", price: "$3.99", dims: '4" × 6"', w: 4, h: 6 },
  { value: "5x7", label: "5×7", price: "$5.99", dims: '5" × 7"', w: 5, h: 7 },
];

const FONT_SIZES = [
  { pt: 11, label: "S",  desc: "Small"   },
  { pt: 15, label: "M",  desc: "Medium"  },
  { pt: 19, label: "L",  desc: "Large"   },
  { pt: 24, label: "XL", desc: "X-Large" },
];

const FRAME_STYLES: { value: FrameStyle; label: string; icon: string; desc: string }[] = [
  { value: "polaroid", label: "Polaroid", icon: "📸", desc: "White frame + caption" },
  { value: "classic",  label: "Classic",  icon: "🖼",  desc: "Black border + shadow" },
  { value: "square",   label: "Square",   icon: "⬛",  desc: "Square crop + shadow"  },
  { value: "float",    label: "Float",    icon: "✨",  desc: "No border, shadow only" },
  { value: "naked",    label: "No Frame", icon: "🖼️",  desc: "Raw photo, no frame"   },
];

// Max width of the inside-panel preview in px
const PREVIEW_W = 290;

export default function CardConfigurator({ card }: CardConfiguratorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [photoStage, setPhotoStage] = useState<PhotoStage>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // Photo state
  const [rawPhotoSrc, setRawPhotoSrc] = useState<string | null>(null);
  const [croppedPhotoSrc, setCroppedPhotoSrc] = useState<string | null>(null);
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>(DEFAULT_CAPTION_STYLE);

  // Step 2 state
  const [message, setMessage] = useState("");
  const [selectedSize, setSelectedSize] = useState("5x7");
  const [isBlankInside, setIsBlankInside] = useState(false);
  const [messageFontSize, setMessageFontSize] = useState(15);

  // ── Photo file handling ───────────────────────────────────
  const handleFileChange = useCallback((file: File | null) => {
    if (!file) return;
    const accepted = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!accepted.includes(file.type)) { alert("Please upload a JPEG, PNG, or WebP image."); return; }
    if (file.size > 10 * 1024 * 1024) { alert("Please keep your image under 10MB."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      setRawPhotoSrc(e.target?.result as string);
      setCroppedPhotoSrc(null);
      setCaptionStyle(DEFAULT_CAPTION_STYLE);
      setPhotoStage("editing");
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files?.[0] || null);
  }, [handleFileChange]);

  const handleEditorConfirm = useCallback((croppedUrl: string, cs: CaptionStyle) => {
    setCroppedPhotoSrc(croppedUrl);
    setCaptionStyle(cs);
    setPhotoStage("confirmed");
  }, []);

  const uploadCroppedPhoto = async (): Promise<string | null> => {
    if (!croppedPhotoSrc) return null;
    const res = await fetch(croppedPhotoSrc);
    const blob = await res.blob();
    const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", file);
    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
    if (!uploadRes.ok) { const err = await uploadRes.json(); throw new Error(err.error || "Upload failed"); }
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
      if (croppedPhotoSrc) uploadedPhotoUrl = await uploadCroppedPhoto();

      // frameStyle is part of captionStyle (set inside PhotoEditor)
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
          insideFontSize: messageFontSize,
        }),
      });

      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Could not create order"); }
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
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Checkout failed"); }
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      alert(err.message || "Checkout error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSizeData = SIZES.find((s) => s.value === selectedSize)!;

  // Compute inside-panel preview dimensions from selected card size
  const previewH = Math.round(PREVIEW_W * (selectedSizeData.h / selectedSizeData.w));
  // Scale font for screen: 1pt ≈ 1.333px at 96dpi, panel is cardW inches × 72pt/in,
  // displayed at PREVIEW_W px → scale = PREVIEW_W / (cardW × 72)
  const pdfPanelPt = selectedSizeData.w * 72; // pt width of inside panel
  const displayFontPx = Math.round(messageFontSize * (PREVIEW_W / pdfPanelPt) * 1.15);

  // ── Step 1A — Upload Zone ─────────────────────────────────
  const renderUploadZone = () => (
    <div>
      <div className={styles.stepIndicator}>
        <span>Step 1 of 3</span><span>Your Photo (Optional)</span>
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
        <p className={styles.uploadLabel}>Drag &amp; drop a photo here, or click to browse</p>
        <p className={styles.uploadHint}>JPEG, PNG or WebP · Max 10MB</p>
      </div>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }} onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        id="photo-file-input" aria-label="Photo file input" />
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
      <div className={styles.stepIndicator}><span>Step 1 of 3</span><span>Crop &amp; Style</span></div>
      <h2 className={styles.stepTitle}>Edit your photo</h2>
      <PhotoEditor
        imageSrc={rawPhotoSrc!}
        initialCaption={captionStyle}
        onConfirm={handleEditorConfirm}
        onCancel={() => { setPhotoStage("upload"); setRawPhotoSrc(null); }}
      />
    </div>
  );

  // ── Step 1C — Confirmed photo ─────────────────────────────
  // CSS frame preview styles (mirrors the PDF rendering visually)
  const framePreviewStyle = (fs: FrameStyle, src: string): React.ReactNode => {
    const base: React.CSSProperties = { display: "block", width: "100%", objectFit: "cover" };
    switch (fs) {
      case "classic":
        return <img src={src} alt="frame preview" style={{ ...base, border: "4px solid #111", boxShadow: "5px 5px 0 rgba(0,0,0,0.25)" }} />;
      case "square":
        return <img src={src} alt="frame preview" style={{ ...base, border: "3px solid #1a1a1a", boxShadow: "4px 4px 0 rgba(0,0,0,0.25)", aspectRatio: "1/1" }} />;
      case "float":
        return <img src={src} alt="frame preview" style={{ ...base, boxShadow: "6px 6px 0 rgba(0,0,0,0.22)" }} />;
      case "naked":
        return <img src={src} alt="frame preview" style={base} />;
      default: // polaroid
        return (
          <div style={{ background: "#fff", padding: "8px", paddingBottom: "36px", boxShadow: "0 6px 24px rgba(0,0,0,0.15)", display: "inline-block", width: "100%", boxSizing: "border-box" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="frame preview" style={{ width: "100%", display: "block", aspectRatio: "4/3", objectFit: "cover" }} />
            {captionStyle.text && (
              <p style={{ margin: "6px 0 0", fontSize: `${captionStyle.fontSize * 0.9}px`, fontFamily: captionStyle.fontFamily, color: captionStyle.color, textAlign: captionStyle.align, fontStyle: captionStyle.italic ? "italic" : "normal", fontWeight: captionStyle.bold ? "bold" : "normal", lineHeight: 1.3 }}>
                {captionStyle.text}
              </p>
            )}
          </div>
        );
    }
  };

  const renderConfirmed = () => (
    <div>
      <div className={styles.stepIndicator}><span>Step 1 of 3</span><span>Photo Ready ✓</span></div>
      <h2 className={styles.stepTitle}>Photo &amp; caption set</h2>
      <div className={styles.confirmedPhotoRow}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={croppedPhotoSrc!} alt="Your cropped photo" className={styles.confirmedPhotoThumb} />
        <div className={styles.confirmedPhotoInfo}>
          <strong>Photo added</strong>
          {captionStyle.text && (
            <div className={styles.confirmedPhotoCaptionPreview}>Caption: &ldquo;{captionStyle.text}&rdquo;</div>
          )}
          <div style={{ fontSize: "0.76rem", marginTop: "0.2rem", color: "var(--muted-foreground)" }}>
            {captionStyle.fontFamily.split(",")[0]} · {captionStyle.fontSize}pt ·{" "}
            <span style={{ color: captionStyle.color }}>■</span> {captionStyle.align}
          </div>
        </div>
        <button className={styles.confirmedPhotoEdit} onClick={() => setPhotoStage("editing")} id="re-edit-photo-btn">
          ✏️ Edit
        </button>
      </div>

      {/* Frame style picker */}
      <div className={styles.formGroup} style={{ marginTop: "1.25rem" }}>
        <label>Photo Frame Style</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.4rem", marginTop: "0.5rem" }}>
          {FRAME_STYLES.map((fs) => (
            <button
              key={fs.value}
              id={`frame-${fs.value}`}
              onClick={() => setCaptionStyle(prev => ({ ...prev, frameStyle: fs.value }))}
              title={fs.desc}
              style={{
                padding: "0.5rem 0.2rem 0.4rem",
                borderRadius: "var(--radius-md)",
                border: `1.5px solid ${(captionStyle.frameStyle ?? "polaroid") === fs.value ? "var(--mint)" : "var(--border)"}`,
                background: (captionStyle.frameStyle ?? "polaroid") === fs.value ? "var(--muted)" : "transparent",
                color: (captionStyle.frameStyle ?? "polaroid") === fs.value ? "var(--foreground)" : "var(--muted-foreground)",
                cursor: "pointer",
                transition: "all 0.18s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.15rem",
                fontWeight: (captionStyle.frameStyle ?? "polaroid") === fs.value ? 600 : 400,
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>{fs.icon}</span>
              <span style={{ fontSize: "0.65rem", textAlign: "center", lineHeight: 1.2 }}>{fs.label}</span>
            </button>
          ))}
        </div>
        <p style={{ fontSize: "0.72rem", color: "var(--muted-foreground)", marginTop: "0.4rem" }}>
          {FRAME_STYLES.find(f => f.value === (captionStyle.frameStyle ?? "polaroid"))?.desc}
        </p>
      </div>

      <button className={styles.uploadZoneCompact}
        onClick={() => { setPhotoStage("upload"); setRawPhotoSrc(null); setCroppedPhotoSrc(null); }}
        style={{ width: "100%", marginBottom: "1rem" }}>
        📷 Change or remove photo
      </button>
      <div className={styles.actions}>
        <div />
        <button className={styles.btnNext} onClick={goToStep2} id="step1-next-btn">Continue →</button>
      </div>
    </div>
  );

  // ── Step 2 — Message + Size + Font Size ───────────────────
  const renderStep2 = () => (
    <div>
      <div className={styles.stepIndicator}>
        <span>Step 2 of 3</span><span>Message, Size &amp; Font</span>
      </div>
      <h2 className={styles.stepTitle}>Write your message</h2>

      {/* Blank inside toggle */}
      <label htmlFor="blank-inside-toggle" style={{
        display: "flex", alignItems: "center", gap: "0.6rem",
        padding: "0.75rem 1rem", borderRadius: "var(--radius-md)",
        border: `1.5px solid ${isBlankInside ? "var(--mint)" : "var(--border)"}`,
        background: isBlankInside ? "var(--muted)" : "transparent",
        cursor: "pointer", marginBottom: "1.25rem", transition: "all 0.2s ease",
        fontSize: "0.9rem", fontWeight: 500,
      }}>
        <input id="blank-inside-toggle" type="checkbox" checked={isBlankInside}
          onChange={(e) => setIsBlankInside(e.target.checked)}
          style={{ accentColor: "var(--mint)", width: "1.1rem", height: "1.1rem" }} />
        ✍️ Leave inside blank — I&apos;ll handwrite my message
        <span style={{ fontSize: "0.78rem", color: "var(--muted-foreground)", fontWeight: 400, marginLeft: "auto" }}>
          Inside prints blank
        </span>
      </label>

      {!isBlankInside && (
        <div className={styles.formGroup}>
          <label htmlFor="inside-message">
            Inside-right message{" "}
            <span style={{ fontWeight: 400, color: "var(--muted-foreground)" }}>({message.length} chars)</span>
          </label>
          <textarea id="inside-message" className={styles.textarea} value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your personal message here. This will be printed on the inside right of the card..."
            rows={7} />
        </div>
      )}

      {isBlankInside && (
        <div style={{
          padding: "1.25rem", background: "var(--muted)", borderRadius: "var(--radius-md)",
          border: "1.5px dashed var(--mint-soft)", textAlign: "center",
          color: "var(--muted-foreground)", fontSize: "0.88rem", marginBottom: "1rem",
        }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>✍️</div>
          The inside right panel will be printed <strong>blank</strong>.<br />
          Plenty of room for your own handwriting.
        </div>
      )}

      {/* Font size picker */}
      {!isBlankInside && (
        <div className={styles.formGroup} style={{ marginTop: "1.25rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            Text Size
            <span style={{ fontWeight: 400, color: "var(--muted-foreground)", fontSize: "0.82rem" }}>
              — choose how large your message prints
            </span>
          </label>
          <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.5rem" }}>
            {FONT_SIZES.map((fs) => (
              <button
                key={fs.pt}
                id={`font-size-${fs.label}`}
                onClick={() => setMessageFontSize(fs.pt)}
                style={{
                  flex: 1,
                  padding: "0.6rem 0.25rem 0.5rem",
                  borderRadius: "var(--radius-md)",
                  border: `1.5px solid ${messageFontSize === fs.pt ? "var(--mint)" : "var(--border)"}`,
                  background: messageFontSize === fs.pt ? "var(--muted)" : "transparent",
                  color: messageFontSize === fs.pt ? "var(--foreground)" : "var(--muted-foreground)",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.15rem",
                  fontWeight: messageFontSize === fs.pt ? 600 : 400,
                }}
              >
                <span style={{ fontSize: `${10 + (FONT_SIZES.indexOf(fs) * 3)}px`, lineHeight: 1.2, fontFamily: "Georgia, serif" }}>
                  A
                </span>
                <span style={{ fontSize: "0.7rem" }}>{fs.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Card Size */}
      <div className={styles.formGroup} style={{ marginTop: "1.5rem" }}>
        <label>Card Size</label>
        <div className={styles.sizeOptions}>
          {SIZES.map((s) => (
            <button key={s.value} id={`size-${s.value}`}
              className={`${styles.sizeOption} ${selectedSize === s.value ? styles.sizeOptionSelected : ""}`}
              onClick={() => setSelectedSize(s.value)}>
              <div className={styles.sizeName}>{s.label}</div>
              <div className={styles.sizePrice}>{s.price}</div>
              <div className={styles.sizeDims}>{s.dims}</div>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.btnBack} onClick={() => setStep(1)} id="step2-back-btn">← Back</button>
        <button className={styles.btnNext} onClick={goToStep3}
          disabled={isSubmitting || (!isBlankInside && !message.trim())} id="step2-next-btn">
          {isSubmitting ? "Generating Preview…" : "Preview My Card →"}
        </button>
      </div>
    </div>
  );

  // ── Step 3 — Preview & Checkout ───────────────────────────
  const renderStep3 = () => (
    <div>
      <div className={styles.stepIndicator}><span>Step 3 of 3</span><span>Preview &amp; Download</span></div>
      <h2 className={styles.stepTitle}>Your card preview</h2>
      <p style={{ fontSize: "0.88rem", color: "var(--muted-foreground)", marginBottom: "1rem" }}>
        This watermarked preview shows your complete 4-panel layout. Purchase to download the clean, print-ready PDF.
      </p>
      {pdfPreviewUrl && (
        <div className={styles.pdfPreview}>
          <iframe src={pdfPreviewUrl} title="Card Preview" />
        </div>
      )}
      <div className={styles.checkoutSummary} style={{ marginTop: "1.5rem" }}>
        <div className={styles.summaryRow}><span>Card Design</span><span>{card.name}</span></div>
        <div className={styles.summaryRow}><span>Size</span><span>{selectedSizeData.label} ({selectedSizeData.dims})</span></div>
        <div className={styles.summaryRow}><span>Photo &amp; caption</span><span>{croppedPhotoSrc ? "Yes" : "No"}</span></div>
        <div className={styles.summaryRow}>
          <span>Text size</span>
          <span>{FONT_SIZES.find(f => f.pt === messageFontSize)?.desc ?? "Medium"}</span>
        </div>
        <div className={styles.totalRow}><span>Total</span><span>{selectedSizeData.price}</span></div>
      </div>
      <button id="checkout-btn" className={styles.btnNext}
        style={{ width: "100%", padding: "0.9rem", fontSize: "1rem" }}
        onClick={handleCheckout} disabled={isSubmitting}>
        {isSubmitting ? "Redirecting to Checkout…" : `Purchase & Download — ${selectedSizeData.price}`}
      </button>
      <button className={styles.btnBack}
        style={{ width: "100%", marginTop: "0.75rem", textAlign: "center" }}
        onClick={() => setStep(2)} id="step3-back-btn">
        ← Edit Message or Size
      </button>
    </div>
  );

  const isEditorOpen = step === 1 && photoStage === "editing";
  const showInsidePreview = step === 2 && !isBlankInside && message.trim().length > 0;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Dancing+Script:wght@400;600&family=Inter:wght@400;500&display=swap" />

      {isEditorOpen ? (
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 2rem 5rem" }}>
          <div className={styles.wizard} style={{ padding: 0 }}>{renderEditor()}</div>
        </div>
      ) : (
        <div className={styles.configuratorLayout}>
          {/* Left — Card preview (sticky) */}
          <div className={styles.cardPreviewSticky}>

            {/* Step 2: show live inside panel preview */}
            {step === 2 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                {/* Size label */}
                <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", margin: 0 }}>
                  Inside panel · {selectedSizeData.dims} · {FONT_SIZES.find(f => f.pt === messageFontSize)?.desc} text
                </p>

                {/* Inside panel preview card */}
                <div style={{
                  width: `${PREVIEW_W}px`,
                  height: `${previewH}px`,
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "24px 20px",
                  boxSizing: "border-box",
                  transition: "width 0.3s ease, height 0.3s ease",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  {showInsidePreview ? (
                    <p style={{
                      fontSize: `${displayFontPx}px`,
                      lineHeight: 1.6,
                      color: "#1a1a1a",
                      textAlign: "center",
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                      margin: 0,
                      transition: "font-size 0.2s ease",
                      fontFamily: "Georgia, 'Times New Roman', serif",
                    }}>
                      {message}
                    </p>
                  ) : (
                    <p style={{
                      fontSize: "0.8rem",
                      color: "#bbb",
                      textAlign: "center",
                      fontStyle: "italic",
                      margin: 0,
                    }}>
                      Your message will appear here
                    </p>
                  )}

                  {/* Subtle corner mark to show scale */}
                  <span style={{
                    position: "absolute", bottom: 6, right: 8,
                    fontSize: "9px", color: "#ccc", fontFamily: "monospace",
                  }}>
                    {selectedSizeData.dims}
                  </span>
                </div>

                {/* Comparison label */}
                <p style={{ fontSize: "0.72rem", color: "var(--muted-foreground)", textAlign: "center", margin: 0 }}>
                  Preview of inside right panel at selected size
                </p>
              </div>
            ) : (
              /* Steps 1 & 3: show front image */
              <>
                <Image
                  src={card.front_image_url}
                  alt={`${card.name} front`}
                  width={400}
                  height={560}
                  className={styles.cardPreviewImage}
                  priority
                />

                {step === 1 && photoStage === "confirmed" && croppedPhotoSrc && (
                <div style={{ marginTop: "1.5rem", textAlign: "center", maxWidth: "220px", margin: "1.5rem auto 0" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {framePreviewStyle((captionStyle.frameStyle ?? "polaroid") as FrameStyle, croppedPhotoSrc)}
                  <p style={{ fontSize: "0.72rem", color: "var(--muted-foreground)", marginTop: "0.5rem" }}>
                    Inside-left · {FRAME_STYLES.find(f => f.value === (captionStyle.frameStyle ?? "polaroid"))?.label}
                  </p>
                </div>
              )}

                <div className={styles.lockedBadge}>
                  <span>🔒</span>
                  <span>Front &amp; back designed by the artist.</span>
                </div>
              </>
            )}
          </div>

          {/* Right — Step wizard */}
          <div className={styles.wizard}>
            {step === 1 && photoStage === "upload"     && renderUploadZone()}
            {step === 1 && photoStage === "confirmed"  && renderConfirmed()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </div>
        </div>
      )}
    </>
  );
}
