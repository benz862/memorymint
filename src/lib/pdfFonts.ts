/**
 * pdfFonts.ts
 * Registers Google Fonts (Dancing Script, Playfair Display, Inter) with
 * @react-pdf/renderer using locally bundled @fontsource files.
 *
 * Import this module at the top of any server-side PDF component file.
 * Font.register() is called once per process — safe to import multiple times.
 */

import { Font } from '@react-pdf/renderer';
import path from 'path';

// Base path to @fontsource font files (in node_modules)
const fontsBase = path.resolve(process.cwd(), 'node_modules');

let registered = false;

export function registerPdfFonts() {
  if (registered) return;
  registered = true;

  // ── Dancing Script ──────────────────────────────────────────────────────
  Font.register({
    family: 'Dancing Script',
    fonts: [
      {
        src: path.join(fontsBase, '@fontsource/dancing-script/files/dancing-script-latin-400-normal.woff'),
        fontWeight: 400,
      },
      {
        src: path.join(fontsBase, '@fontsource/dancing-script/files/dancing-script-latin-700-normal.woff'),
        fontWeight: 700,
      },
    ],
  });

  // ── Playfair Display ────────────────────────────────────────────────────
  Font.register({
    family: 'Playfair Display',
    fonts: [
      {
        src: path.join(fontsBase, '@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff'),
        fontWeight: 400,
        fontStyle: 'normal',
      },
      {
        src: path.join(fontsBase, '@fontsource/playfair-display/files/playfair-display-latin-400-italic.woff'),
        fontWeight: 400,
        fontStyle: 'italic',
      },
      {
        src: path.join(fontsBase, '@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff'),
        fontWeight: 700,
        fontStyle: 'normal',
      },
      {
        src: path.join(fontsBase, '@fontsource/playfair-display/files/playfair-display-latin-700-italic.woff'),
        fontWeight: 700,
        fontStyle: 'italic',
      },
    ],
  });

  // ── Inter ───────────────────────────────────────────────────────────────
  Font.register({
    family: 'Inter',
    fonts: [
      {
        src: path.join(fontsBase, '@fontsource/inter/files/inter-latin-400-normal.woff'),
        fontWeight: 400,
      },
      {
        src: path.join(fontsBase, '@fontsource/inter/files/inter-latin-700-normal.woff'),
        fontWeight: 700,
      },
    ],
  });
}

/**
 * Maps a web font family name to the registered PDF family name + weight/style.
 * Returns style props to spread onto a react-pdf <Text> element.
 */
export function pdfFontStyle(
  fontFamily: string,
  bold = false,
  italic = false,
): { fontFamily: string; fontWeight: number; fontStyle: string } {
  const f = fontFamily.toLowerCase();

  if (f.includes('dancing')) {
    return { fontFamily: 'Dancing Script', fontWeight: bold ? 700 : 400, fontStyle: 'normal' };
  }
  if (f.includes('playfair')) {
    return { fontFamily: 'Playfair Display', fontWeight: bold ? 700 : 400, fontStyle: italic ? 'italic' : 'normal' };
  }
  if (f.includes('inter')) {
    return { fontFamily: 'Inter', fontWeight: bold ? 700 : 400, fontStyle: 'normal' };
  }
  // Georgia / serif fallback → Playfair (closest aesthetic match)
  if (f.includes('georgia') || f.includes('serif')) {
    return { fontFamily: 'Playfair Display', fontWeight: bold ? 700 : 400, fontStyle: italic ? 'italic' : 'normal' };
  }

  // Default: Inter (clean sans)
  return { fontFamily: 'Inter', fontWeight: bold ? 700 : 400, fontStyle: 'normal' };
}
