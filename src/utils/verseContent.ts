import type { Verse, QuranFont } from '../types/api';

/** Returns the `fields` query param string for the given font. Always includes text_uthmani as fallback. */
export function buildVerseFields(font: QuranFont): string {
  return font === 'text_uthmani' ? 'text_uthmani' : `text_uthmani,${font}`;
}

/** Extracts display-ready content from a raw Verse. */
export function extractVerseContent(
  verse: Verse,
  font: QuranFont,
  showTranslation: boolean,
): { arabic: string; translation: string | null } {
  const arabic = (verse[font] as string | undefined) ?? verse.text_uthmani ?? '';
  const translation = showTranslation ? (verse.translations?.[0]?.text ?? null) : null;
  return { arabic, translation };
}
