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
import path from 'path';
import { registerPdfFonts, pdfFontStyle } from '@/lib/pdfFonts';

registerPdfFonts();

// Polaroid frame PNG & MemoryMint logo for watermark tiling
const POLAROID_FRAME = path.join(process.cwd(), 'public', 'polaroid photo frame.png');
const MEMORYMINT_LOGO = path.join(process.cwd(), 'public', 'MemoryMint_Logo.png');

// ── Logo watermark tile grid ─────────────────────────────────────────────────
// Stamps small MemoryMint logos in a staggered brick pattern at 40% opacity.
const TILE_W = 72;           // logo width in points
const LOGO_RATIO = 481 / 772; // height ÷ width from actual pixel dims (772×481)
const TILE_H = TILE_W * LOGO_RATIO; // ~44.9pt — preserves aspect ratio
const TILE_COL_GAP = 96;  // horizontal distance between tile centres
const TILE_ROW_GAP = 72;  // vertical distance between tile centres

function LogoTileGrid({ areaW, areaH }: { areaW: number; areaH: number }) {
  const cols = Math.ceil(areaW / TILE_COL_GAP) + 1;
  const rows = Math.ceil(areaH / TILE_ROW_GAP) + 1;
  const tiles: React.ReactElement[] = [];
  for (let r = 0; r < rows; r++) {
    const stagger = r % 2 === 0 ? 0 : TILE_COL_GAP / 2;
    for (let c = 0; c < cols + 1; c++) {
      const x = c * TILE_COL_GAP - TILE_W / 2 + stagger - TILE_COL_GAP / 2;
      const y = r * TILE_ROW_GAP - TILE_H / 2;
      tiles.push(
        <Image
          key={`wm-${r}-${c}`}
          src={MEMORYMINT_LOGO}
          style={{ position: 'absolute', top: y, left: x, width: TILE_W, height: TILE_H, opacity: 0.40 }}
        />
      );
    }
  }
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, width: areaW, height: areaH, overflow: 'hidden' }}>
      {tiles}
    </View>
  );
}
const POLAROID_RATIO = 6442 / 7997;
const PL = 0.055;
const PT = 0.04;
const PW = 0.89;
const PH = 0.75;
const CAPTION_T = 0.80;

// ─────────────────────────────────────────────────────────────────────────────
// CardDocument — print-ready card with trim marks & fold guides
//
// Layout:
//   US Letter landscape (11" × 8.5") — the card spread is centered on it.
//   Page 1: outer spread — Back (left) | Front (right)
//   Page 2: inner spread — Photo/polaroid (left) | Message (right)
//
// Marks:
//   • Corner trim marks at actual card edges (not bleed edge)
//   • Center fold dashes at card vertical midpoint (top & bottom)
//   • "Fold here", "Trim" labels in 6pt gray
//
// Bleed:
//   The artwork images supplied are assumed to be 0.25" (18pt) larger on each
//   edge beyond the trim line (standard bleed). The images fill the panel
//   including bleed; trim marks show where to cut.
// ─────────────────────────────────────────────────────────────────────────────

// US Letter landscape
const LETTER_W = 792; // 11"
const LETTER_H = 612; // 8.5"

// Card panel sizes in points (72pt = 1")
const CARD_SIZES = {
  '5x7': { panelW: 360, panelH: 504 },  // 5" × 7"
  '4x6': { panelW: 288, panelH: 432 },  // 4" × 6"
};

const BLEED = 9;  // 0.125" per side (image supplied as trim + 0.125" each edge)
const MARK_LEN = 18; // trim mark line length (0.25")
const MARK_GAP = 6;  // gap between card edge and start of mark (0.0833")
const MARK_COLOR = '#777777';
const FOLD_COLOR = '#AAAAAA';

// ── Trim + Fold Marks overlay ─────────────────────────────────────────────────
function PrintMarks({
  cardX, cardY, cardW, cardH, midX,
}: {
  cardX: number; cardY: number; cardW: number; cardH: number; midX: number;
}) {
  const x0 = cardX;  // left trim edge
  const x1 = cardX + cardW; // right trim edge
  const y0 = cardY;  // top trim edge
  const y1 = cardY + cardH; // bottom trim edge

  return (
    <Svg width={LETTER_W} height={LETTER_H} style={{ position: 'absolute', top: 0, left: 0 }}>

      {/* ── Corner trim marks ─────────────────────────────── */}
      {/* Top-left corner */}
      <Line x1={x0 - MARK_GAP - MARK_LEN} y1={y0} x2={x0 - MARK_GAP} y2={y0} stroke={MARK_COLOR} strokeWidth={0.5} />
      <Line x1={x0} y1={y0 - MARK_GAP - MARK_LEN} x2={x0} y2={y0 - MARK_GAP} stroke={MARK_COLOR} strokeWidth={0.5} />

      {/* Top-right corner */}
      <Line x1={x1 + MARK_GAP} y1={y0} x2={x1 + MARK_GAP + MARK_LEN} y2={y0} stroke={MARK_COLOR} strokeWidth={0.5} />
      <Line x1={x1} y1={y0 - MARK_GAP - MARK_LEN} x2={x1} y2={y0 - MARK_GAP} stroke={MARK_COLOR} strokeWidth={0.5} />

      {/* Bottom-left corner */}
      <Line x1={x0 - MARK_GAP - MARK_LEN} y1={y1} x2={x0 - MARK_GAP} y2={y1} stroke={MARK_COLOR} strokeWidth={0.5} />
      <Line x1={x0} y1={y1 + MARK_GAP} x2={x0} y2={y1 + MARK_GAP + MARK_LEN} stroke={MARK_COLOR} strokeWidth={0.5} />

      {/* Bottom-right corner */}
      <Line x1={x1 + MARK_GAP} y1={y1} x2={x1 + MARK_GAP + MARK_LEN} y2={y1} stroke={MARK_COLOR} strokeWidth={0.5} />
      <Line x1={x1} y1={y1 + MARK_GAP} x2={x1} y2={y1 + MARK_GAP + MARK_LEN} stroke={MARK_COLOR} strokeWidth={0.5} />

      {/* ── Center fold marks ─────────────────────────────── */}
      {/* Short dashes above & below card at fold line */}
      <Line
        x1={midX} y1={y0 - MARK_GAP - MARK_LEN}
        x2={midX} y2={y0 - MARK_GAP}
        stroke={FOLD_COLOR} strokeWidth={0.5} strokeDasharray="3,2"
      />
      <Line
        x1={midX} y1={y1 + MARK_GAP}
        x2={midX} y2={y1 + MARK_GAP + MARK_LEN}
        stroke={FOLD_COLOR} strokeWidth={0.5} strokeDasharray="3,2"
      />
    </Svg>
  );
}

// ── Back Cover Layout (white, logo + tagline centred in lower third) ──────────
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGO_URL = `${APP_URL}/SkillBinder_Logo.png`;

// 60% gray
const BACK_COVER_TEXT_COLOR = '#666666';

function BackCover({ panelW, panelH }: { panelW: number; panelH: number }) {
  const logoSize = panelW * 0.165;

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
      <Text style={{ fontSize: 7, color: BACK_COVER_TEXT_COLOR, fontFamily: 'Helvetica', textAlign: 'center', marginBottom: 3, maxWidth: panelW * 0.68 }}>
        Part of the SkillBinder collection of life-ready guides and designs.
      </Text>
      <Text style={{ fontSize: 6.5, color: BACK_COVER_TEXT_COLOR, fontFamily: 'Helvetica', textAlign: 'center' }}>
        © SkillBinder. All rights reserved.
      </Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    width: LETTER_W,
    height: LETTER_H,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 1.7,
    color: '#3D3530',
    fontFamily: 'Helvetica',
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
  noPhotoText: {
    fontSize: 22,
    color: '#D4C4BC',
    fontFamily: 'Helvetica',
    textAlign: 'center',
  },
});

// ── Props ─────────────────────────────────────────────────────────────────────
export interface CardDocumentProps {
  message: string;
  messageFontFamily?: string;   // e.g. "Dancing Script", "Georgia", "Inter"
  senderName?: string;          // rendered as italic signature after message
  size: '4x6' | '5x7';
  isWatermarked: boolean;
  frontImageBase64?: string;
  backImageBase64?: string;
  insidePhotoBase64?: string;
  insidePhotoCaption?: string;
}

// Parse caption JSON (matches CaptionStyle in PhotoEditor.tsx)
function parseCaptionStyle(raw?: string) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.text === 'string') return parsed;
  } catch {
    return { text: raw, fontFamily: 'Helvetica', fontSize: 9, color: '#6B6360', align: 'center', bold: false, italic: true };
  }
  return null;
}

// Map web font name → react-pdf built-in
function pdfFontFor(fontFamily: string, italic = false): string {
  const f = fontFamily.toLowerCase();
  const isSerif = f.includes('georgia') || f.includes('playfair') || f.includes('serif') || f.includes('dancing') || f.includes('script');
  const isMono = f.includes('courier');
  if (isSerif) return italic ? 'Times-Italic' : 'Times-Roman';
  if (isMono)  return italic ? 'Courier-Oblique' : 'Courier';
  return italic ? 'Helvetica-Oblique' : 'Helvetica';
}

export const CardDocument = ({
  message,
  messageFontFamily = 'Georgia',
  senderName = '',
  size,
  isWatermarked,
  frontImageBase64,
  backImageBase64,
  insidePhotoBase64,
  insidePhotoCaption,
}: CardDocumentProps) => {
  const { panelW, panelH } = CARD_SIZES[size] ?? CARD_SIZES['5x7'];
  const cardW = panelW * 2; // full unfolded spread width
  const cardH = panelH;

  // Center card on letter page
  const cardX = (LETTER_W - cardW) / 2;
  const cardY = (LETTER_H - cardH) / 2;
  const midX = cardX + panelW; // fold line x

  // ── Bleed-extended artwork panel positions ───────────────────────────────
  // Images = trim + 0.125" per side (9pt). Fold-side bleed masked by overflow:hidden.
  //
  // Back (left panel): view exposes left/top/bottom bleed; clips right (fold) bleed.
  const backPanelStyle = {
    position: 'absolute' as const,
    top: cardY - BLEED,
    left: cardX - BLEED,
    width: panelW + BLEED,      // left bleed shows; right bleed clipped at fold
    height: cardH + BLEED * 2,
    overflow: 'hidden' as const,
  };

  // Front (right panel): view starts at fold; clips left (fold) bleed; exposes right bleed.
  const frontPanelStyle = {
    position: 'absolute' as const,
    top: cardY - BLEED,
    left: midX,
    width: panelW + BLEED,      // right bleed shows; left bleed clipped at fold
    height: cardH + BLEED * 2,
    overflow: 'hidden' as const,
  };

  // Full bleed image dimensions
  const imgW = panelW + BLEED * 2;
  const imgH = cardH + BLEED * 2;

  // Interior panels: pure white.
  const innerPanelBase = {
    position: 'absolute' as const,
    top: cardY,
    width: panelW,
    height: cardH,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden' as const,
  };

  const messagePanelStyle = {
    position: 'absolute' as const,
    top: cardY,
    left: midX,
    width: panelW,
    height: cardH,
    backgroundColor: '#FFFFFF',
    // no overflow:hidden — message must never be clipped
    paddingTop: 40,
    paddingLeft: 36,
    paddingRight: 36,
    paddingBottom: 36,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    justifyContent: 'center' as const,
  };

  const messageFontSize = panelW < 320 ? 10 : 13; // smaller on 4x6

  return (
    <Document title="MemoryMint Card">

      {/* ── PAGE 1: OUTER SPREAD (Back | Front) ────────────── */}
      <Page size={[LETTER_W, LETTER_H] as any} style={styles.page}>

        {/* Panel 4: Back panel */}
        <View style={backPanelStyle}>
          {backImageBase64 ? (
            <Image src={backImageBase64} style={{ position: 'absolute', top: 0, left: 0, width: imgW, height: imgH }} />
          ) : (
            <BackCover panelW={panelW + BLEED} panelH={cardH + BLEED * 2} />
          )}
          {isWatermarked && <LogoTileGrid areaW={panelW + BLEED} areaH={cardH + BLEED * 2} />}
        </View>

        {/* Panel 1: Front panel */}
        <View style={frontPanelStyle}>
          {frontImageBase64 ? (
            <Image src={frontImageBase64} style={{ position: 'absolute', top: 0, left: -BLEED, width: imgW, height: imgH }} />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
              <Text style={{ fontSize: 12, color: '#A09088', fontFamily: 'Helvetica' }}>Card Front</Text>
            </View>
          )}
          {isWatermarked && <LogoTileGrid areaW={panelW + BLEED} areaH={cardH + BLEED * 2} />}
        </View>

        <PrintMarks cardX={cardX} cardY={cardY} cardW={cardW} cardH={cardH} midX={midX} />
      </Page>

      {/* ── PAGE 2: INNER SPREAD (Photo | Message) ─────────── */}
      <Page size={[LETTER_W, LETTER_H] as any} style={styles.page}>

        {/* Panel 2: Inside-left — photo panel */}
        <View style={{ ...innerPanelBase, left: cardX, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {insidePhotoBase64 ? (() => {
            const cs = parseCaptionStyle(insidePhotoCaption);
            const frameStyleVal: string = (cs as any)?.frameStyle || 'polaroid';
            const shadowClr = 'rgba(0,0,0,0.28)';

            if (frameStyleVal === 'classic') {
              const fw = panelW - 56; const fh = Math.round(fw * 0.75); const sd = 5;
              return (
                <View style={{ width: fw + sd, height: fh + sd } as any}>
                  <View style={{ position: 'absolute', top: sd, left: sd, width: fw, height: fh, backgroundColor: shadowClr } as any} />
                  <View style={{ position: 'absolute', top: 0, left: 0, width: fw, height: fh, backgroundColor: '#111111' } as any}>
                    <Image src={insidePhotoBase64} style={{ margin: 5, width: fw - 10, height: fh - 10, objectFit: 'cover' as any }} />
                  </View>
                </View>
              );
            }

            if (frameStyleVal === 'square') {
              const sz = panelW - 60; const sd = 5;
              return (
                <View style={{ width: sz + sd, height: sz + sd } as any}>
                  <View style={{ position: 'absolute', top: sd, left: sd, width: sz, height: sz, backgroundColor: shadowClr } as any} />
                  <View style={{ position: 'absolute', top: 0, left: 0, width: sz, height: sz, backgroundColor: '#1a1a1a' } as any}>
                    <Image src={insidePhotoBase64} style={{ margin: 3, width: sz - 6, height: sz - 6, objectFit: 'cover' as any }} />
                  </View>
                </View>
              );
            }

            if (frameStyleVal === 'float') {
              const fw = panelW - 56; const fh = Math.round(fw * 0.75); const sd = 7;
              return (
                <View style={{ width: fw + sd, height: fh + sd } as any}>
                  <View style={{ position: 'absolute', top: sd, left: sd, width: fw, height: fh, backgroundColor: shadowClr } as any} />
                  <Image src={insidePhotoBase64} style={{ position: 'absolute', top: 0, left: 0, width: fw, height: fh, objectFit: 'cover' as any }} />
                </View>
              );
            }

            if (frameStyleVal === 'naked') {
              const fw = panelW - 40; const fh = Math.round(fw * 0.75);
              return <Image src={insidePhotoBase64} style={{ width: fw, height: fh, objectFit: 'cover' as any }} />;
            }

            // polaroid (default)
            const polW = panelW - 40;
            const polH = polW / POLAROID_RATIO;
            const pLeft = polW * PL;
            const pTop  = polH * PT;
            const pWide = polW * PW;
            const pTall = polH * PH;
            return (
              <View style={{ width: polW, height: polH }}>
                <Image src={insidePhotoBase64} style={{ position: 'absolute', top: pTop, left: pLeft, width: pWide, height: pTall, objectFit: 'cover' as any }} />
                <Image src={POLAROID_FRAME} style={{ position: 'absolute', top: 0, left: 0, width: polW, height: polH }} />
                {cs?.text ? (
                  <Text style={{ position: 'absolute', top: polH * CAPTION_T, left: pLeft, width: pWide, fontSize: Math.max(8, Math.min(cs.fontSize ?? 9, 20)), fontFamily: cs.italic ? 'Helvetica-Oblique' : 'Helvetica', color: cs.color ?? '#6B6360', textAlign: (cs.align ?? 'center') as any } as any}>
                    {cs.text}
                  </Text>
                ) : null}
              </View>
            );
          })() : (
            <View />
          )}
          {isWatermarked && <LogoTileGrid areaW={panelW} areaH={cardH} />}
        </View>

        {/* Panel 3: Inside-right — message */}
        <View style={messagePanelStyle}>
          <Text style={[styles.messageText, { fontSize: messageFontSize, ...pdfFontStyle(messageFontFamily) }] as any}>
            {message}
          </Text>
          {senderName ? (
            <Text style={{ marginTop: 18, fontSize: messageFontSize - 2, ...pdfFontStyle(messageFontFamily, false, true), color: '#6B6360', textAlign: 'right' } as any}>
              — {senderName}
            </Text>
          ) : null}
          {isWatermarked && <LogoTileGrid areaW={panelW} areaH={cardH} />}
        </View>

        <PrintMarks cardX={cardX} cardY={cardY} cardW={cardW} cardH={cardH} midX={midX} />
      </Page>

    </Document>
  );
};
