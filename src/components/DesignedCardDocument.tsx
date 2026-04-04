import React from 'react';
import {
  Page,
  Text,
  View,
  Document,
  Image,
  StyleSheet,
  Svg,
  Line,
} from '@react-pdf/renderer';
import { registerPdfFonts, pdfFontStyle } from '@/lib/pdfFonts';

import path from 'path';

// Register custom fonts once on module load
registerPdfFonts();

// Polaroid frame PNG — absolute path for server-side PDF rendering
const POLAROID_FRAME = path.join(process.cwd(), 'public', 'polaroid photo frame.png');
// Frame native size: 6442 × 7997 px → aspect ratio (W/H):
const POLAROID_RATIO = 6442 / 7997; // ≈ 0.8056
// Photo window within the frame (percentages of frame W / H):
const PL = 0.055; // left edge of photo
const PT = 0.04; // top edge of photo
const PW = 0.89;  // photo width as fraction of frame width
const PH = 0.75;  // photo height as fraction of frame height
const CAPTION_T = 0.80; // top of caption within frame height

// ============================================================
// DesignedCardDocument — 4-panel print-ready card
//
// Page 1 (outer spread, landscape):
//   LEFT  half → Panel 4: Back design (your logo/back image)
//   RIGHT half → Panel 1: Front design (your card artwork)
//
// Page 2 (inner spread, landscape):
//   LEFT  half → Panel 2: Client's photo (polaroid style) + caption
//   RIGHT half → Panel 3: Client's typed message
//
// Fold/cut marks are rendered as thin dashed lines at panel seams.
// ============================================================

// Card panel sizes (72pt = 1")
const SIZES = {
  '5x7': { panelW: 360, panelH: 504 },  // 5" × 7"
  '4x6': { panelW: 288, panelH: 432 },  // 4" × 6"
};

// Page = US Letter landscape (11" × 8.5")
const LETTER_W = 792;
const LETTER_H = 612;

// Trim mark spec
const MARK_LEN = 18;  // 0.25"
const MARK_GAP = 6;   // 0.083" gap between card edge and mark start
const MARK_COLOR = '#777777';
const FOLD_COLOR  = '#AAAAAA';
const FONT_SIZE_MESSAGE = 13;
const DEFAULT_CAPTION_FONT_SIZE = 9;

// ── Back Cover (programmatic — white, logo + tagline in lower third) ──────────
// The logo URL is resolved to an absolute URL so react-pdf can fetch it.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGO_URL = `${APP_URL}/SkillBinder_Logo.png`;

function BackCover({ panelW, panelH }: { panelW: number; panelH: number }) {
  const logoSize = panelW * 0.165; // 25% smaller than original 0.22
  return (
    <View
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: panelW, height: panelH,
        backgroundColor: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: panelH * 0.12,
      }}
    >
      <Image src={LOGO_URL} style={{ width: logoSize, height: logoSize, marginBottom: 10 }} />
      <Text style={{ fontSize: 7, color: '#555555', fontFamily: 'Helvetica', textAlign: 'center', marginBottom: 3, maxWidth: panelW * 0.68 }}>
        Part of the SkillBinder collection of life-ready guides and designs.
      </Text>
      <Text style={{ fontSize: 6.5, color: '#777777', fontFamily: 'Helvetica', textAlign: 'center' }}>
        © SkillBinder. All rights reserved.
      </Text>
    </View>
  );
}

// Maps web font-family strings to @react-pdf/renderer built-in fonts
function pdfFont(fontFamily: string): string {
  const f = fontFamily.toLowerCase();
  if (f.includes('dancing') || f.includes('playfair') || f.includes('georgia') || f.includes('serif')) {
    return 'Times-Roman';
  }
  if (f.includes('courier')) return 'Courier';
  return 'Helvetica'; // inter, arial, sans-serif etc.
}

function pdfFontBoldItalic(fontFamily: string, bold: boolean, italic: boolean): string {
  const base = pdfFont(fontFamily);
  if (base === 'Times-Roman') {
    if (bold && italic) return 'Times-BoldItalic';
    if (bold) return 'Times-Bold';
    if (italic) return 'Times-Italic';
    return 'Times-Roman';
  }
  if (base === 'Courier') {
    if (bold && italic) return 'Courier-BoldOblique';
    if (bold) return 'Courier-Bold';
    if (italic) return 'Courier-Oblique';
    return 'Courier';
  }
  // Helvetica
  if (bold && italic) return 'Helvetica-BoldOblique';
  if (bold) return 'Helvetica-Bold';
  if (italic) return 'Helvetica-Oblique';
  return 'Helvetica';
}

// Caption style parsed from JSON (matches CaptionStyle in PhotoEditor.tsx)
interface CaptionStyleData {
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  align: 'left' | 'center' | 'right';
  bold: boolean;
  italic: boolean;
}

function parseCaptionStyle(raw?: string): CaptionStyleData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.text === 'string') return parsed as CaptionStyleData;
  } catch {
    // Plain string fallback
    return { text: raw, fontFamily: 'Helvetica', fontSize: DEFAULT_CAPTION_FONT_SIZE, color: '#6B6360', align: 'center', bold: false, italic: true };
  }
  return null;
}


function buildStyles(panelW: number, panelH: number) {
  const pageW = panelW * 2;
  const pageH = panelH;

  return StyleSheet.create({
    page: {
      flexDirection: 'row',
      width: pageW,
      height: pageH,
      backgroundColor: '#FFFFFF',
    },
    panel: {
      width: panelW,
      height: pageH,
      position: 'relative',
      overflow: 'hidden',
    },
    // Full-bleed image that fills an entire panel
    fullBleedImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: panelW,
      height: pageH,
      objectFit: 'cover',
    },
    // Inside-right message panel
    messagePanel: {
      width: panelW,
      height: pageH,
      backgroundColor: '#FDFAF7',
      paddingHorizontal: 48,
      paddingVertical: 60,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    },
    messageText: {
      fontSize: FONT_SIZE_MESSAGE,
      lineHeight: 1.75,
      color: '#3D3530',
      fontFamily: 'Helvetica',
    },
    watermarkContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    watermarkText: {
      fontSize: 36,
      color: 'rgba(180,170,165,0.25)',
      fontFamily: 'Helvetica-Bold',
      transform: 'rotate(-40deg)',
    },
    // Polaroid photo container (inside left panel) — warm linen so white Polaroid pops
    photoPanel: {
      width: panelW,
      height: pageH,
      backgroundColor: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },
    polaroidWrapper: {
      backgroundColor: '#FFFFFF',
      paddingTop: 16,
      paddingLeft: 16,
      paddingRight: 16,
      paddingBottom: 52,
      borderWidth: 1,
      borderColor: '#D8D0CB',
      borderStyle: 'solid',
    },
    polaroidImage: {
      width: panelW - 80,
      height: (panelW - 80) * 0.85,
      objectFit: 'cover',
    },
    captionText: {
      marginTop: 8,
      fontSize: DEFAULT_CAPTION_FONT_SIZE,
      fontFamily: 'Helvetica-Oblique',
      color: '#6B6360',
      textAlign: 'center',
      width: panelW - 80,
    },

    noPhotoPanelText: {
      fontSize: 24,
      color: '#D4C4BC',
      fontFamily: 'Helvetica',
      textAlign: 'center',
    },
    // Fold/cut mark lines drawn via SVG
    foldMarkOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
    },
  });
}

// Professional trim marks + fold guide centered on US Letter
function PrintMarks({
  cardX, cardY, cardW, cardH, midX,
}: {
  cardX: number; cardY: number; cardW: number; cardH: number; midX: number;
}) {
  const x0 = cardX;
  const x1 = cardX + cardW;
  const y0 = cardY;
  const y1 = cardY + cardH;

  return (
    <Svg width={LETTER_W} height={LETTER_H} style={{ position: 'absolute', top: 0, left: 0 }}>
      {/* Top-left */}
      <Line x1={x0 - MARK_GAP - MARK_LEN} y1={y0} x2={x0 - MARK_GAP} y2={y0} stroke={MARK_COLOR} strokeWidth={0.5} />
      <Line x1={x0} y1={y0 - MARK_GAP - MARK_LEN} x2={x0} y2={y0 - MARK_GAP} stroke={MARK_COLOR} strokeWidth={0.5} />
      {/* Top-right */}
      <Line x1={x1 + MARK_GAP} y1={y0} x2={x1 + MARK_GAP + MARK_LEN} y2={y0} stroke={MARK_COLOR} strokeWidth={0.5} />
      <Line x1={x1} y1={y0 - MARK_GAP - MARK_LEN} x2={x1} y2={y0 - MARK_GAP} stroke={MARK_COLOR} strokeWidth={0.5} />
      {/* Bottom-left */}
      <Line x1={x0 - MARK_GAP - MARK_LEN} y1={y1} x2={x0 - MARK_GAP} y2={y1} stroke={MARK_COLOR} strokeWidth={0.5} />
      <Line x1={x0} y1={y1 + MARK_GAP} x2={x0} y2={y1 + MARK_GAP + MARK_LEN} stroke={MARK_COLOR} strokeWidth={0.5} />
      {/* Bottom-right */}
      <Line x1={x1 + MARK_GAP} y1={y1} x2={x1 + MARK_GAP + MARK_LEN} y2={y1} stroke={MARK_COLOR} strokeWidth={0.5} />
      <Line x1={x1} y1={y1 + MARK_GAP} x2={x1} y2={y1 + MARK_GAP + MARK_LEN} stroke={MARK_COLOR} strokeWidth={0.5} />
      {/* Center fold dashes above & below */}
      <Line x1={midX} y1={y0 - MARK_GAP - MARK_LEN} x2={midX} y2={y0 - MARK_GAP} stroke={FOLD_COLOR} strokeWidth={0.5} strokeDasharray="3,2" />
      <Line x1={midX} y1={y1 + MARK_GAP} x2={midX} y2={y1 + MARK_GAP + MARK_LEN} stroke={FOLD_COLOR} strokeWidth={0.5} strokeDasharray="3,2" />
    </Svg>
  );
}

// ---- Props ----
export interface DesignedCardDocumentProps {
  frontImageBase64: string;
  backImageBase64: string;
  insidePhotoBase64?: string;
  insidePhotoCaption?: string;
  insideMessage: string;
  messageFontFamily?: string;  // e.g. "Dancing Script", "Georgia", "Inter"
  senderName?: string;         // appended as signature on the message panel
  size: '4x6' | '5x7';
  isWatermarked: boolean;
}


export const DesignedCardDocument = ({
  frontImageBase64,
  backImageBase64,
  insidePhotoBase64,
  insidePhotoCaption,
  insideMessage,
  messageFontFamily = 'Georgia',
  senderName = '',
  size,
  isWatermarked,
}: DesignedCardDocumentProps) => {
  const { panelW, panelH } = SIZES[size] ?? SIZES['5x7'];
  const cardW = panelW * 2;
  const cardH = panelH;
  const styles = buildStyles(panelW, panelH);

  // Center card on US Letter landscape
  const cardX = (LETTER_W - cardW) / 2;
  const cardY = (LETTER_H - cardH) / 2;
  const midX = cardX + panelW;

  const pageStyle = {
    width: LETTER_W,
    height: LETTER_H,
    backgroundColor: '#FFFFFF',
    position: 'relative' as const,
  };

  // ── Bleed-extended artwork panels ──────────────────────────────────────
  // Images are 5.25" × 7.25" (for 5×7) = trim + 0.125" per side = 9pt per side.
  //
  // BACK panel (left of spread):
  //   - Bleed shows on: left, top, bottom
  //   - RIGHT bleed (fold side) is masked by overflow:hidden at the fold
  //   - View clips at fold (midX); image natural width = panelW + 2*BLEED
  //
  // FRONT panel (right of spread):
  //   - Bleed shows on: right, top, bottom
  //   - LEFT bleed (fold side) is masked by overflow:hidden at the fold
  //   - Image offset left by -BLEED so its trim edge sits on the fold

  const BLEED_PT = 9; // 0.125" per side in points

  // Back: view starts BLEED past left trim, ends at fold (overflow clips right bleed)
  const backPanel = {
    position: 'absolute' as const,
    top: cardY - BLEED_PT,
    left: cardX - BLEED_PT,
    width: panelW + BLEED_PT,   // left bleed exposed; right bleed clipped at fold
    height: cardH + BLEED_PT * 2,
    overflow: 'hidden' as const,
  };

  // Front: view starts at fold, extends BLEED past right trim (overflow clips left bleed)
  const frontPanel = {
    position: 'absolute' as const,
    top: cardY - BLEED_PT,
    left: midX,                  // starts exactly at fold
    width: panelW + BLEED_PT,   // right bleed exposed; left bleed clipped at fold
    height: cardH + BLEED_PT * 2,
    overflow: 'hidden' as const,
  };

  // Full image dimensions (trim + bleed on each side)
  const imgW = panelW + BLEED_PT * 2;
  const imgH = cardH + BLEED_PT * 2;

  // Interior panels: exact trim size, pure white
  // Note: no overflow:hidden on message panel so text is never clipped
  const innerPanel = (left: number) => ({
    position: 'absolute' as const,
    top: cardY,
    left,
    width: panelW,
    height: cardH,
    backgroundColor: '#FFFFFF',
  });

  return (
    <Document title="MemoryMint Pre-Designed Card">
      {/* ── PAGE 1: OUTER SPREAD ──────────────────────────────── */}
      <Page size={[LETTER_W, LETTER_H] as any} style={pageStyle}>
        {/* Back — logo cover, no artwork bleed needed on back */}
        <View style={backPanel}>
          <BackCover panelW={panelW + BLEED_PT} panelH={cardH + BLEED_PT * 2} />
        </View>

        {/* Front — image offset left by -BLEED so fold-side bleed is hidden by overflow:hidden */}
        <View style={frontPanel}>
          <Image
            src={frontImageBase64}
            style={{ position: 'absolute', top: 0, left: -BLEED_PT, width: imgW, height: imgH }}
          />
        </View>

        <PrintMarks cardX={cardX} cardY={cardY} cardW={cardW} cardH={cardH} midX={midX} />
      </Page>

      {/* ── PAGE 2: INNER SPREAD ──────────────────────────────── */}
      <Page size={[LETTER_W, LETTER_H] as any} style={pageStyle}>
        {/* Inside Left — pure white, photo centred */}
        <View style={{ ...innerPanel(cardX), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <View style={styles.photoPanel}>
            {insidePhotoBase64 ? (() => {
              const cs = parseCaptionStyle(insidePhotoCaption);
              const captionPdfFont = cs
                ? pdfFontStyle(cs.fontFamily, cs.bold, cs.italic)
                : { fontFamily: 'Helvetica-Oblique', fontWeight: 400, fontStyle: 'italic' };
              const captionFontSize = cs ? Math.max(8, Math.min(cs.fontSize, 20)) : DEFAULT_CAPTION_FONT_SIZE;
              const captionColor = cs?.color || '#6B6360';
              const captionAlign = cs?.align || 'center';
              const captionText = cs?.text || '';

              // Size the polaroid to fill the panel with some breathing room
              const polW = panelW - 40;
              const polH = polW / POLAROID_RATIO;
              // Absolute coords of the photo window
              const pLeft = polW * PL;
              const pTop  = polH * PT;
              const pWide = polW * PW;
              const pTall = polH * PH;

              return (
                <View style={{ width: polW, height: polH }}>
                  {/* Layer 1 — user photo sits behind the frame */}
                  <Image
                    src={insidePhotoBase64}
                    style={{
                      position: 'absolute',
                      top: pTop,
                      left: pLeft,
                      width: pWide,
                      height: pTall,
                      objectFit: 'cover' as any,
                    }}
                  />
                  {/* Layer 2 — polaroid frame overlaid on top */}
                  <Image
                    src={POLAROID_FRAME}
                    style={{ position: 'absolute', top: 0, left: 0, width: polW, height: polH }}
                  />
                  {/* Layer 3 — caption in the bottom white strip */}
                  {captionText ? (
                    <Text
                      style={[
                        {
                          position: 'absolute',
                          top: polH * CAPTION_T,
                          left: pLeft,
                          width: pWide,
                          fontSize: captionFontSize,
                          color: captionColor,
                          textAlign: captionAlign as any,
                          ...captionPdfFont,
                        },
                      ] as any}
                    >
                      {captionText}
                    </Text>
                  ) : null}
                </View>
              );
            })() : (
              // No photo → nothing, don’t show any frame
              <View />
            )}
          </View>
        </View>

        {/* Inside Right — message + signature in chosen font */}
        <View style={{ ...innerPanel(midX), paddingTop: 40, paddingLeft: 36, paddingRight: 36, paddingBottom: 36, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          <Text style={[styles.messageText, {
            fontSize: panelW < 320 ? 10 : FONT_SIZE_MESSAGE,
            ...pdfFontStyle(messageFontFamily, false, false),
          } as any]}>{insideMessage}</Text>
          {senderName ? (
            <Text style={{
              marginTop: 18,
              fontSize: panelW < 320 ? 9 : 11,
              ...pdfFontStyle(messageFontFamily, false, true),
              color: '#6B6360',
              textAlign: 'right',
            } as any}>
              — {senderName}
            </Text>
          ) : null}
          {isWatermarked && (
            <View style={styles.watermarkContainer}>
              <Text style={styles.watermarkText}>PREVIEW • MemoryMint</Text>
            </View>
          )}
        </View>

        <PrintMarks cardX={cardX} cardY={cardY} cardW={cardW} cardH={cardH} midX={midX} />
      </Page>
    </Document>
  );
};
