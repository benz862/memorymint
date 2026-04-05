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

registerPdfFonts();

// ── Asset paths ───────────────────────────────────────────────────────────────
const POLAROID_FRAME = path.join(process.cwd(), 'public', 'polaroid photo frame.png');
const MEMORYMINT_LOGO = path.join(process.cwd(), 'public', 'MemoryMint_Logo.png');
const POLAROID_RATIO = 6442 / 7997;
const PL = 0.055;
const PT = 0.04;
const PW = 0.89;
const PH = 0.75;
const CAPTION_T = 0.80;

// ── Card sizes ────────────────────────────────────────────────────────────────
const SIZES = {
  '5x7': { panelW: 360, panelH: 504 },
  '4x6': { panelW: 288, panelH: 432 },
};

const LETTER_W = 792;
const LETTER_H = 612;
const MARK_LEN = 18;
const MARK_GAP = 6;
const MARK_COLOR = '#777777';
const FOLD_COLOR  = '#AAAAAA';
const FONT_SIZE_MESSAGE = 13;
const DEFAULT_CAPTION_FONT_SIZE = 9;

// ── Back cover brand text (60% gray) ─────────────────────────────────────────
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGO_URL = `${APP_URL}/SkillBinder_Logo.png`;
const BACK_TEXT_COLOR = '#666666';

// ── Logo watermark tile grid ──────────────────────────────────────────────────
// Stamps a grid of small MemoryMint logos across the given area.
// The logo is rendered at natural colour but at 40% opacity so it reads as
// a muted, non-distracting deterrent on any background.
const TILE_W = 72;           // logo width in points
const LOGO_RATIO = 481 / 772; // height ÷ width from actual pixel dims (772×481)
const TILE_H = TILE_W * LOGO_RATIO; // ~44.9pt — preserves aspect ratio
const TILE_COL_GAP = 96;  // horizontal distance between tile centres
const TILE_ROW_GAP = 72;  // vertical distance between tile centres

function LogoTileGrid({
  areaW,
  areaH,
  offsetX = 0,
  offsetY = 0,
}: {
  areaW: number;
  areaH: number;
  offsetX?: number;
  offsetY?: number;
}) {
  const cols = Math.ceil(areaW / TILE_COL_GAP) + 1;
  const rows = Math.ceil(areaH / TILE_ROW_GAP) + 1;

  const tiles: React.ReactElement[] = [];
  for (let r = 0; r < rows; r++) {
    const stagger = r % 2 === 0 ? 0 : TILE_COL_GAP / 2;
    for (let c = 0; c < cols + 1; c++) {
      const x = offsetX + c * TILE_COL_GAP - TILE_W / 2 + stagger - TILE_COL_GAP / 2;
      const y = offsetY + r * TILE_ROW_GAP - TILE_H / 2;
      tiles.push(
        <Image
          key={`wm-${r}-${c}`}
          src={MEMORYMINT_LOGO}
          style={{
            position: 'absolute',
            top: y,
            left: x,
            width: TILE_W,
            height: TILE_H,
            opacity: 0.40,
          }}
        />
      );
    }
  }

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: areaW,
        height: areaH,
        overflow: 'hidden',
      }}
    >
      {tiles}
    </View>
  );
}

// ── Back cover ────────────────────────────────────────────────────────────────
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
      <Text style={{ fontSize: 7, color: BACK_TEXT_COLOR, fontFamily: 'Helvetica', textAlign: 'center', marginBottom: 3, maxWidth: panelW * 0.68 }}>
        Part of the SkillBinder collection of life-ready guides and designs.
      </Text>
      <Text style={{ fontSize: 6.5, color: BACK_TEXT_COLOR, fontFamily: 'Helvetica', textAlign: 'center' }}>
        © SkillBinder. All rights reserved.
      </Text>
    </View>
  );
}

// ── Font helpers ──────────────────────────────────────────────────────────────
function pdfFont(fontFamily: string): string {
  const f = fontFamily.toLowerCase();
  if (f.includes('dancing') || f.includes('playfair') || f.includes('georgia') || f.includes('serif')) return 'Times-Roman';
  if (f.includes('courier')) return 'Courier';
  return 'Helvetica';
}

// ── Caption style ─────────────────────────────────────────────────────────────
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
    return { text: raw, fontFamily: 'Helvetica', fontSize: DEFAULT_CAPTION_FONT_SIZE, color: '#6B6360', align: 'center', bold: false, italic: true };
  }
  return null;
}

// ── Per-render styles ─────────────────────────────────────────────────────────
function buildStyles(panelW: number, panelH: number) {
  return StyleSheet.create({
    page: {
      flexDirection: 'row',
      width: panelW * 2,
      height: panelH,
      backgroundColor: '#FFFFFF',
    },
    messageText: {
      fontSize: FONT_SIZE_MESSAGE,
      lineHeight: 1.75,
      color: '#3D3530',
      fontFamily: 'Helvetica',
    },
    photoPanel: {
      width: panelW,
      height: panelH,
      backgroundColor: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },
    foldMarkOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
    },
  });
}

// ── Print marks ───────────────────────────────────────────────────────────────
function PrintMarks({ cardX, cardY, cardW, cardH, midX }: {
  cardX: number; cardY: number; cardW: number; cardH: number; midX: number;
}) {
  const x0 = cardX, x1 = cardX + cardW, y0 = cardY, y1 = cardY + cardH;
  return (
    <Svg width={LETTER_W} height={LETTER_H} style={{ position: 'absolute', top: 0, left: 0 }}>
      <Line x1={x0-MARK_GAP-MARK_LEN} y1={y0} x2={x0-MARK_GAP} y2={y0} stroke={MARK_COLOR} strokeWidth={0.5} />
      <Line x1={x0} y1={y0-MARK_GAP-MARK_LEN} x2={x0} y2={y0-MARK_GAP} stroke={MARK_COLOR} strokeWidth={0.5} />
      <Line x1={x1+MARK_GAP} y1={y0} x2={x1+MARK_GAP+MARK_LEN} y2={y0} stroke={MARK_COLOR} strokeWidth={0.5} />
      <Line x1={x1} y1={y0-MARK_GAP-MARK_LEN} x2={x1} y2={y0-MARK_GAP} stroke={MARK_COLOR} strokeWidth={0.5} />
      <Line x1={x0-MARK_GAP-MARK_LEN} y1={y1} x2={x0-MARK_GAP} y2={y1} stroke={MARK_COLOR} strokeWidth={0.5} />
      <Line x1={x0} y1={y1+MARK_GAP} x2={x0} y2={y1+MARK_GAP+MARK_LEN} stroke={MARK_COLOR} strokeWidth={0.5} />
      <Line x1={x1+MARK_GAP} y1={y1} x2={x1+MARK_GAP+MARK_LEN} y2={y1} stroke={MARK_COLOR} strokeWidth={0.5} />
      <Line x1={x1} y1={y1+MARK_GAP} x2={x1} y2={y1+MARK_GAP+MARK_LEN} stroke={MARK_COLOR} strokeWidth={0.5} />
      <Line x1={midX} y1={y0-MARK_GAP-MARK_LEN} x2={midX} y2={y0-MARK_GAP} stroke={FOLD_COLOR} strokeWidth={0.5} strokeDasharray="3,2" />
      <Line x1={midX} y1={y1+MARK_GAP} x2={midX} y2={y1+MARK_GAP+MARK_LEN} stroke={FOLD_COLOR} strokeWidth={0.5} strokeDasharray="3,2" />
    </Svg>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface DesignedCardDocumentProps {
  frontImageBase64: string;
  backImageBase64: string;
  insidePhotoBase64?: string;
  insidePhotoCaption?: string;
  insideMessage: string;
  messageFontFamily?: string;
  senderName?: string;
  size: '4x6' | '5x7';
  isWatermarked: boolean;
}

export const DesignedCardDocument = ({
  frontImageBase64,
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

  const cardX = (LETTER_W - cardW) / 2;
  const cardY = (LETTER_H - cardH) / 2;
  const midX = cardX + panelW;

  const pageStyle = {
    width: LETTER_W,
    height: LETTER_H,
    backgroundColor: '#FFFFFF',
    position: 'relative' as const,
  };

  const BLEED_PT = 9;

  const backPanel = {
    position: 'absolute' as const,
    top: cardY - BLEED_PT,
    left: cardX - BLEED_PT,
    width: panelW + BLEED_PT,
    height: cardH + BLEED_PT * 2,
    overflow: 'hidden' as const,
  };

  const frontPanel = {
    position: 'absolute' as const,
    top: cardY - BLEED_PT,
    left: midX,
    width: panelW + BLEED_PT,
    height: cardH + BLEED_PT * 2,
    overflow: 'hidden' as const,
  };

  const imgW = panelW + BLEED_PT * 2;
  const imgH = cardH + BLEED_PT * 2;

  const innerPanel = (left: number) => ({
    position: 'absolute' as const,
    top: cardY,
    left,
    width: panelW,
    height: cardH,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden' as const,
  });

  return (
    <Document title="MemoryMint Pre-Designed Card">

      {/* ── PAGE 1: OUTER SPREAD (Back | Front) ─── */}
      <Page size={[LETTER_W, LETTER_H] as any} style={pageStyle}>

        {/* Panel 4 — Back cover */}
        <View style={backPanel}>
          <BackCover panelW={panelW + BLEED_PT} panelH={cardH + BLEED_PT * 2} />
          {isWatermarked && (
            <LogoTileGrid areaW={panelW + BLEED_PT} areaH={cardH + BLEED_PT * 2} />
          )}
        </View>

        {/* Panel 1 — Front card image */}
        <View style={frontPanel}>
          <Image
            src={frontImageBase64}
            style={{ position: 'absolute', top: 0, left: -BLEED_PT, width: imgW, height: imgH }}
          />
          {isWatermarked && (
            <LogoTileGrid areaW={panelW + BLEED_PT} areaH={cardH + BLEED_PT * 2} />
          )}
        </View>

        <PrintMarks cardX={cardX} cardY={cardY} cardW={cardW} cardH={cardH} midX={midX} />
      </Page>

      {/* ── PAGE 2: INNER SPREAD (Photo | Message) ─── */}
      <Page size={[LETTER_W, LETTER_H] as any} style={pageStyle}>

        {/* Panel 2 — Inside left: polaroid photo */}
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
                  {captionText ? (
                    <Text style={[{ position: 'absolute', top: polH * CAPTION_T, left: pLeft, width: pWide, fontSize: captionFontSize, color: captionColor, textAlign: captionAlign as any, ...captionPdfFont }] as any}>
                      {captionText}
                    </Text>
                  ) : null}
                </View>
              );
            })() : <View />}
          </View>
          {isWatermarked && (
            <LogoTileGrid areaW={panelW} areaH={cardH} />
          )}
        </View>

        {/* Panel 3 — Inside right: message */}
        <View style={{ ...innerPanel(midX), paddingTop: 40, paddingLeft: 36, paddingRight: 36, paddingBottom: 36, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Text style={[styles.messageText, {
            fontSize: panelW < 320 ? 10 : FONT_SIZE_MESSAGE,
            ...pdfFontStyle(messageFontFamily, false, false),
          } as any]}>{insideMessage}</Text>
          {senderName ? (
            <Text style={{ marginTop: 18, fontSize: panelW < 320 ? 9 : 11, ...pdfFontStyle(messageFontFamily, false, true), color: '#6B6360', textAlign: 'right' } as any}>
              — {senderName}
            </Text>
          ) : null}
          {isWatermarked && (
            <LogoTileGrid areaW={panelW} areaH={cardH} />
          )}
        </View>

        <PrintMarks cardX={cardX} cardY={cardY} cardW={cardW} cardH={cardH} midX={midX} />
      </Page>
    </Document>
  );
};
