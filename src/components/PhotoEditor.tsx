"use client";

import { useEffect, useRef, useState, useCallback } from "react";

import styles from "@/app/catalogue/catalogue.module.css";

// ── Types ────────────────────────────────────────────────────
export interface CaptionStyle {
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  align: "left" | "center" | "right";
  bold: boolean;
  italic: boolean;
  frameStyle?: string; // polaroid | classic | square | float | naked
}

export const DEFAULT_CAPTION_STYLE: CaptionStyle = {
  text: "",
  fontFamily: "Georgia, serif",
  fontSize: 13,
  color: "#6B6360",
  align: "center",
  bold: false,
  italic: true,
  frameStyle: "polaroid",
};

// ── Frame Styles ─────────────────────────────────────────────
const FRAME_STYLES = [
  { value: "polaroid", label: "Polaroid", icon: "📸", desc: "White frame + caption" },
  { value: "classic",  label: "Classic",  icon: "🖼",  desc: "Black border + shadow" },
  { value: "square",   label: "Square",   icon: "⬛",  desc: "Square crop + shadow"  },
  { value: "float",    label: "Float",    icon: "✨",  desc: "No border, shadow only" },
  { value: "naked",    label: "No Frame", icon: "🖼️",  desc: "Raw photo, no frame"   },
];

// ── Font Options ─────────────────────────────────────────────
const FONTS = [
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Playfair", value: "'Playfair Display', Georgia, serif" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Courier", value: "'Courier New', monospace" },
  { label: "Arial", value: "Arial, sans-serif" },
];

// ── Color Swatches ───────────────────────────────────────────
const COLORS = [
  "#6B6360", // warm gray (default)
  "#2C2C2C", // near black
  "#8B5E52", // warm brown
  "#4A7C6E", // forest green
  "#5B6E8A", // slate blue
  "#9B5E7A", // dusty rose
  "#C8973A", // gold
  "#FFFFFF", // white
];

// ── Crop State ───────────────────────────────────────────────
interface CropRect {
  x: number; // 0–1 (fraction of display canvas)
  y: number;
  w: number;
  h: number;
}

// ── Props ────────────────────────────────────────────────────
interface PhotoEditorProps {
  imageSrc: string; // original data URL
  initialCaption?: CaptionStyle;
  onConfirm: (croppedDataUrl: string, captionStyle: CaptionStyle) => void;
  onCancel: () => void;
}

// ── Helpers ──────────────────────────────────────────────────
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function PhotoEditor({
  imageSrc,
  initialCaption,
  onConfirm,
  onCancel,
}: PhotoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Caption state
  const [caption, setCaption] = useState<CaptionStyle>(
    initialCaption || DEFAULT_CAPTION_STYLE
  );

  // ── Zoom, pan & crop ─────────────────────────────────────
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0); // image pan offset in canvas pixels
  const [panY, setPanY] = useState(0);

  const CANVAS_W = 480;
  const CANVAS_H = 360;
  const POLAROID_AR = (0.89 * (6442 / 7997)) / 0.75; // ≈ 0.956 W:H

  // Crop ratio — null means free (no AR lock)
  const [cropAR, setCropAR] = useState<number | null>(POLAROID_AR);

  const CROP_RATIOS: { label: string; ar: number | null }[] = [
    { label: "Photo", ar: POLAROID_AR },
    { label: "4:3",   ar: 4 / 3 },
    { label: "3:2",   ar: 3 / 2 },
    { label: "16:9",  ar: 16 / 9 },
    { label: "1:1",   ar: 1 },
    { label: "3:4",   ar: 3 / 4 },
    { label: "2:3",   ar: 2 / 3 },
    { label: "Free",  ar: null },
  ];

  // AR-aware helpers (used only when cropAR is not null)
  const hFromW = (w: number, ar: number) => (w * CANVAS_W) / (CANVAS_H * ar);
  const wFromH = (h: number, ar: number) => (h * CANVAS_H * ar) / CANVAS_W;

  // Build a centered crop for a given AR (or free box for null)
  const centeredCrop = (ar: number | null): CropRect => {
    if (ar === null) return { x: 0.1, y: 0.1, w: 0.8, h: 0.8 };
    const w = Math.min(wFromH(0.78, ar), 0.92);
    const h = hFromW(w, ar);
    return { x: (1 - w) / 2, y: Math.max(0.02, (1 - h) / 2), w, h };
  };

  const [crop, setCrop] = useState<CropRect>(() => centeredCrop(POLAROID_AR));

  // Drag state — includes pan mode
  const dragRef = useRef<{
    handle: "move" | "nw" | "ne" | "sw" | "se" | "pan";
    startX: number;
    startY: number;
    startCrop: CropRect;
    startPanX: number;
    startPanY: number;
  } | null>(null);

  const HANDLE_SIZE = 10;

  // ── Draw canvas ───────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Draw image scaled (with zoom applied around center + pan offset)
    const scaledW = img.naturalWidth * zoom;
    const scaledH = img.naturalHeight * zoom;
    const offsetX = (W - scaledW) / 2 + panX;
    const offsetY = (H - scaledH) / 2 + panY;

    ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);

    // Dim areas outside crop
    const cx = crop.x * W;
    const cy = crop.y * H;
    const cw = crop.w * W;
    const ch = crop.h * H;

    ctx.fillStyle = "rgba(0,0,0,0.48)";
    // Top
    ctx.fillRect(0, 0, W, cy);
    // Bottom
    ctx.fillRect(0, cy + ch, W, H - cy - ch);
    // Left
    ctx.fillRect(0, cy, cx, ch);
    // Right
    ctx.fillRect(cx + cw, cy, W - cx - cw, ch);

    // Crop border
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx, cy, cw, ch);

    // Rule-of-thirds grid
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 0.8;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + (cw * i) / 3, cy);
      ctx.lineTo(cx + (cw * i) / 3, cy + ch);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy + (ch * i) / 3);
      ctx.lineTo(cx + cw, cy + (ch * i) / 3);
      ctx.stroke();
    }

    // Corner handles
    const handles: [number, number][] = [
      [cx, cy],
      [cx + cw, cy],
      [cx, cy + ch],
      [cx + cw, cy + ch],
    ];
    for (const [hx, hy] of handles) {
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(hx, hy, HANDLE_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [zoom, crop, panX, panY]);

  // Load image once
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      draw();
    };
    img.src = imageSrc;
  }, [imageSrc, draw]);

  // Redraw on state change
  useEffect(() => {
    draw();
  }, [draw]);

  // ── Pointer Events ───────────────────────────────────────
  const getHandle = (
    px: number,
    py: number,
    W: number,
    H: number
  ): "move" | "nw" | "ne" | "sw" | "se" | "pan" => {
    const cx = crop.x * W;
    const cy = crop.y * H;
    const cw = crop.w * W;
    const ch = crop.h * H;
    const hs = HANDLE_SIZE;

    if (Math.abs(px - cx) < hs && Math.abs(py - cy) < hs) return "nw";
    if (Math.abs(px - (cx + cw)) < hs && Math.abs(py - cy) < hs) return "ne";
    if (Math.abs(px - cx) < hs && Math.abs(py - (cy + ch)) < hs) return "sw";
    if (Math.abs(px - (cx + cw)) < hs && Math.abs(py - (cy + ch)) < hs) return "se";
    if (px > cx && px < cx + cw && py > cy && py < cy + ch) return "move";
    return "pan"; // drag outside crop box → pan the image
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (canvas.width / rect.width);
    const py = (e.clientY - rect.top) * (canvas.height / rect.height);
    const handle = getHandle(px, py, canvas.width, canvas.height);
    canvas.setPointerCapture(e.pointerId);
    dragRef.current = { handle, startX: px, startY: py, startCrop: { ...crop }, startPanX: panX, startPanY: panY };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (canvas.width / rect.width);
    const py = (e.clientY - rect.top) * (canvas.height / rect.height);

    // ── Pan mode: drag outside crop box moves the image ──────
    if (dragRef.current.handle === "pan") {
      setPanX(dragRef.current.startPanX + (px - dragRef.current.startX));
      setPanY(dragRef.current.startPanY + (py - dragRef.current.startY));
      return;
    }

    const W = canvas.width;
    const H = canvas.height;
    const dx = (px - dragRef.current.startX) / W;
    const dy = (py - dragRef.current.startY) / H;
    const sc = dragRef.current.startCrop;
    const MIN = 0.08;
    let { x, y, w, h } = sc;

    if (cropAR === null) {
      // ── Free resize — no AR lock ───────────────────────────
      switch (dragRef.current.handle) {
        case "move":
          x = clamp(sc.x + dx, 0, 1 - sc.w);
          y = clamp(sc.y + dy, 0, 1 - sc.h);
          break;
        case "se":
          w = clamp(sc.w + dx, MIN, 1 - sc.x);
          h = clamp(sc.h + dy, MIN, 1 - sc.y);
          break;
        case "sw": {
          const right = sc.x + sc.w;
          x = clamp(sc.x + dx, 0, right - MIN);
          w = right - x;
          h = clamp(sc.h + dy, MIN, 1 - sc.y);
          break;
        }
        case "ne": {
          const bottom = sc.y + sc.h;
          w = clamp(sc.w + dx, MIN, 1 - sc.x);
          h = clamp(sc.h - dy, MIN, bottom);
          y = bottom - h;
          break;
        }
        case "nw": {
          const right = sc.x + sc.w;
          const bottom = sc.y + sc.h;
          x = clamp(sc.x + dx, 0, right - MIN);
          w = right - x;
          h = clamp(sc.h - dy, MIN, bottom);
          y = bottom - h;
          break;
        }
      }
    } else {
      // ── Locked AR resize ───────────────────────────────────
      const ar = cropAR;
      switch (dragRef.current.handle) {
        case "move":
          x = clamp(sc.x + dx, 0, 1 - sc.w);
          y = clamp(sc.y + dy, 0, 1 - sc.h);
          break;
        case "se": {
          w = clamp(sc.w + dx, MIN, 1 - sc.x);
          h = hFromW(w, ar);
          if (sc.y + h > 1) { h = 1 - sc.y; w = wFromH(h, ar); }
          break;
        }
        case "sw": {
          const right = sc.x + sc.w;
          x = clamp(sc.x + dx, 0, right - MIN);
          w = right - x;
          h = hFromW(w, ar);
          if (sc.y + h > 1) { h = 1 - sc.y; w = wFromH(h, ar); x = right - w; }
          break;
        }
        case "ne": {
          const bottom = sc.y + sc.h;
          w = clamp(sc.w + dx, MIN, 1 - sc.x);
          h = hFromW(w, ar);
          y = bottom - h;
          if (y < 0) { y = 0; h = bottom; w = wFromH(h, ar); }
          break;
        }
        case "nw": {
          const right = sc.x + sc.w;
          const bottom = sc.y + sc.h;
          x = clamp(sc.x + dx, 0, right - MIN);
          w = right - x;
          h = hFromW(w, ar);
          y = bottom - h;
          if (y < 0) { y = 0; h = bottom; w = wFromH(h, ar); x = right - w; }
          break;
        }
      }
    }

    setCrop({ x, y, w, h });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  // ── Export cropped image ──────────────────────────────────
  const exportCropped = (): string => {
    const canvas = canvasRef.current!;
    const img = imgRef.current!;
    const W = canvas.width;
    const H = canvas.height;

    // Map crop fractions back to image pixel coords (including pan)
    const scaledW = img.naturalWidth * zoom;
    const scaledH = img.naturalHeight * zoom;
    const offsetX = (W - scaledW) / 2 + panX;
    const offsetY = (H - scaledH) / 2 + panY;

    const srcX = (crop.x * W - offsetX) / zoom;
    const srcY = (crop.y * H - offsetY) / zoom;
    const srcW = (crop.w * W) / zoom;
    const srcH = (crop.h * H) / zoom;

    const out = document.createElement("canvas");
    out.width = Math.round(srcW);
    out.height = Math.round(srcH);
    const octx = out.getContext("2d")!;
    octx.drawImage(
      img,
      srcX, srcY, srcW, srcH,
      0, 0, out.width, out.height
    );
    return out.toDataURL("image/jpeg", 0.92);
  };

  const handleConfirm = () => {
    const croppedUrl = exportCropped();
    onConfirm(croppedUrl, caption);
  };

  // ── Polaroid preview ──────────────────────────────────────
  const polaroidCaptionStyle: React.CSSProperties = {
    fontFamily: caption.fontFamily,
    fontSize: `${caption.fontSize}px`,
    color: caption.color,
    textAlign: caption.align,
    fontWeight: caption.bold ? "bold" : "normal",
    fontStyle: caption.italic ? "italic" : "normal",
    marginTop: "6px",
    padding: "0 4px",
    wordBreak: "break-word",
    lineHeight: 1.4,
  };

  const updateCaption = (partial: Partial<CaptionStyle>) =>
    setCaption((prev) => ({ ...prev, ...partial }));

  return (
    <div className={styles.editorPanel}>
      {/* ── Top: Canvas crop area ── */}
      <div className={styles.editorCropArea}>
        <canvas
          ref={canvasRef}
          width={480}
          height={360}
          className={styles.cropCanvas}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{ touchAction: "none" }}
        />

        {/* Zoom slider */}
        <div className={styles.zoomRow}>
          <span className={styles.zoomLabel}>🔍 Zoom</span>
          <input
            id="zoom-slider"
            type="range"
            min={0.1}
            max={8}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className={styles.zoomSlider}
          />
          <span className={styles.zoomValue}>{zoom.toFixed(1)}×</span>
        </div>

        {/* Pan hint + Reset */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)", flex: 1 }}>
            Drag outside crop box to pan · crop corners to resize
          </span>
          <button
            className={styles.btnResetCrop}
            onClick={() => {
              setCrop(centeredCrop(cropAR));
              setZoom(1);
              setPanX(0);
              setPanY(0);
            }}
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* ── Bottom two columns: Caption controls + live preview ── */}
      <div className={styles.editorBottom}>

        {/* Caption Controls */}
        <div className={styles.captionControls}>

          {/* — Crop Ratio — lives here so it’s always visible */}
          <div className={styles.captionControlGroup}>
            <label className={styles.captionControlLabel}>📐 Crop Ratio</label>
            <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
              {CROP_RATIOS.map((r) => (
                <button
                  key={r.label}
                  onClick={() => { setCropAR(r.ar); setCrop(centeredCrop(r.ar)); setPanX(0); setPanY(0); }}
                  className={`${styles.fontChip} ${cropAR === r.ar ? styles.fontChipActive : ""}`}
                  style={{ padding: "0.2rem 0.4rem", fontSize: "0.68rem" }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Frame Style */}
          <div className={styles.captionControlGroup}>
            <label className={styles.captionControlLabel}>Frame Style</label>
            <div className={styles.fontGrid}>
              {FRAME_STYLES.map((fs) => (
                <button
                  key={fs.value}
                  className={`${styles.fontChip} ${(caption.frameStyle ?? "polaroid") === fs.value ? styles.fontChipActive : ""}`}
                  onClick={() => updateCaption({ frameStyle: fs.value })}
                  title={fs.desc}
                  style={{ flexDirection: "column", gap: "0.15rem", padding: "0.4rem 0.2rem" }}
                >
                  <span style={{ fontSize: "1rem" }}>{fs.icon}</span>
                  <span style={{ fontSize: "0.62rem" }}>{fs.label}</span>
                </button>
              ))}
            </div>
            <span className={styles.charCount} style={{ fontSize: "0.7rem", color: "#888", marginTop: "0.2rem", display: "block", textAlign: "left" }}>
              {FRAME_STYLES.find(f => f.value === (caption.frameStyle ?? "polaroid"))?.desc}
            </span>
          </div>

          <div className={styles.captionControlGroup}>
            <label htmlFor="caption-text" className={styles.captionControlLabel}>Caption text</label>
            <input
              id="caption-text"
              className={styles.input}
              value={caption.text}
              maxLength={80}
              onChange={(e) => updateCaption({ text: e.target.value })}
              placeholder="e.g. Our trip to Ireland, 2023"
            />
            <span className={styles.charCount}>{caption.text.length}/80</span>
          </div>

          {/* Font */}
          <div className={styles.captionControlGroup}>
            <label className={styles.captionControlLabel}>Font</label>
            <div className={styles.fontGrid}>
              {FONTS.map((f) => (
                <button
                  key={f.value}
                  className={`${styles.fontChip} ${caption.fontFamily === f.value ? styles.fontChipActive : ""}`}
                  style={{ fontFamily: f.value }}
                  onClick={() => updateCaption({ fontFamily: f.value })}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className={styles.captionControlGroup}>
            <label className={styles.captionControlLabel}>
              Size: {caption.fontSize}pt
            </label>
            <input
              type="range"
              min={9}
              max={22}
              step={1}
              value={caption.fontSize}
              onChange={(e) => updateCaption({ fontSize: Number(e.target.value) })}
              className={styles.zoomSlider}
              aria-label="Caption font size"
            />
          </div>

          {/* Color */}
          <div className={styles.captionControlGroup}>
            <label className={styles.captionControlLabel}>Color</label>
            <div className={styles.colorRow}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`${styles.colorSwatch} ${caption.color === c ? styles.colorSwatchActive : ""}`}
                  style={{ background: c, border: c === "#FFFFFF" ? "1px solid #ccc" : "none" }}
                  onClick={() => updateCaption({ color: c })}
                  title={c}
                  aria-label={`Color ${c}`}
                />
              ))}
              <input
                type="color"
                value={caption.color}
                onChange={(e) => updateCaption({ color: e.target.value })}
                className={styles.colorPicker}
                title="Custom color"
                aria-label="Custom color picker"
              />
            </div>
          </div>

          {/* Align + Style toggles */}
          <div className={styles.captionControlGroup}>
            <label className={styles.captionControlLabel}>Style &amp; Alignment</label>
            <div className={styles.styleRow}>
              <button
                className={`${styles.styleBtn} ${caption.bold ? styles.styleBtnActive : ""}`}
                onClick={() => updateCaption({ bold: !caption.bold })}
                style={{ fontWeight: "bold" }}
                aria-pressed={caption.bold}
              >B</button>
              <button
                className={`${styles.styleBtn} ${caption.italic ? styles.styleBtnActive : ""}`}
                onClick={() => updateCaption({ italic: !caption.italic })}
                style={{ fontStyle: "italic" }}
                aria-pressed={caption.italic}
              ><em>I</em></button>
              <span className={styles.styleDivider} />
              {(["left", "center", "right"] as const).map((a) => (
                <button
                  key={a}
                  className={`${styles.styleBtn} ${caption.align === a ? styles.styleBtnActive : ""}`}
                  onClick={() => updateCaption({ align: a })}
                  aria-pressed={caption.align === a}
                  title={`Align ${a}`}
                >
                  {a === "left" ? "⬅" : a === "center" ? "↔" : "➡"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Frame Preview */}
        <div className={styles.editorPreviewCol}>
          <div className={styles.editorPreviewLabel}>Live Preview</div>
          {(() => {
            const fs = caption.frameStyle ?? "polaroid";
            const photoBox = (
              <div className={styles.polaroidPhotoBox}>
                <CropPreviewImg imageSrc={imageSrc} crop={crop} zoom={zoom} />
              </div>
            );
            const captionEl = caption.text ? (
              <div style={polaroidCaptionStyle}>{caption.text}</div>
            ) : null;
            if (fs === "classic") return (
              <div>
                <div style={{ border: "4px solid #111", boxShadow: "5px 5px 0 rgba(0,0,0,0.25)", width: "100%" }}>
                  {photoBox}
                </div>
                {captionEl && <div style={{ ...polaroidCaptionStyle, color: "#ddd", marginTop: "4px" }}>{caption.text}</div>}
              </div>
            );
            if (fs === "square") return (
              <div>
                <div style={{ border: "3px solid #1a1a1a", boxShadow: "4px 4px 0 rgba(0,0,0,0.25)", aspectRatio: "1/1", overflow: "hidden", width: "100%" }}>
                  {photoBox}
                </div>
                {captionEl && <div style={{ ...polaroidCaptionStyle, color: "#ddd", marginTop: "4px" }}>{caption.text}</div>}
              </div>
            );
            if (fs === "float") return (
              <div>
                <div style={{ boxShadow: "6px 6px 0 rgba(0,0,0,0.22)", width: "100%" }}>
                  {photoBox}
                </div>
                {captionEl && <div style={{ ...polaroidCaptionStyle, color: "#ddd", marginTop: "4px" }}>{caption.text}</div>}
              </div>
            );
            if (fs === "naked") return (
              <div>
                <div style={{ width: "100%" }}>{photoBox}</div>
                {captionEl && <div style={{ ...polaroidCaptionStyle, color: "#ddd", marginTop: "4px" }}>{caption.text}</div>}
              </div>
            );
            // polaroid (default)
            return (
              <div className={styles.polaroidPreviewLarge}>
                {photoBox}
                {captionEl}
              </div>
            );
          })()}
          <p className={styles.editorPreviewHint}>
            {FRAME_STYLES.find(f => f.value === (caption.frameStyle ?? "polaroid"))?.desc}
          </p>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className={styles.editorActions}>
        <button className={styles.btnBack} onClick={onCancel}>
          ← Change Photo
        </button>
        <button className={styles.btnNext} onClick={handleConfirm} id="apply-crop-btn">
          Apply & Continue →
        </button>
      </div>
    </div>
  );
}

// ── Small live preview canvas (separate from the main editor) ─
function CropPreviewImg({
  imageSrc,
  crop,
  zoom,
}: {
  imageSrc: string;
  crop: CropRect;
  zoom: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = ref.current;
      if (!canvas) return;
      const W = 200;
      // Match polaroid photo window ratio: W/H ≈ 1.024
      const H = Math.round(W / ((0.89 * (6442 / 7997)) / 0.75)); // ≈ 209
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      // Source coords relative to natural image (mirroring the main canvas logic)
      const MAIN_W = 480;
      const MAIN_H = 360;
      const scaledW = img.naturalWidth * zoom;
      const scaledH = img.naturalHeight * zoom;
      const offsetX = (MAIN_W - scaledW) / 2;
      const offsetY = (MAIN_H - scaledH) / 2;

      const srcX = (crop.x * MAIN_W - offsetX) / zoom;
      const srcY = (crop.y * MAIN_H - offsetY) / zoom;
      const srcW = (crop.w * MAIN_W) / zoom;
      const srcH = (crop.h * MAIN_H) / zoom;

      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, W, H);
    };
    img.src = imageSrc;
  }, [imageSrc, crop, zoom]);

  return (
    <canvas
      ref={ref}
      width={200}
      height={150}
      style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
    />
  );
}
