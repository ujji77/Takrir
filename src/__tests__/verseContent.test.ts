import { buildVerseFields, extractVerseContent } from '../utils/verseContent';
import type { Verse } from '../types/api';

const baseVerse: Verse = {
  id: 1,
  chapter_id: 2,
  verse_number: 1,
  verse_key: '2:1',
  text_uthmani: 'الم',
  juz_number: 1,
  page_number: 2,
};

describe('buildVerseFields', () => {
  it('returns only text_uthmani for text_uthmani font', () => {
    expect(buildVerseFields('text_uthmani')).toBe('text_uthmani');
  });

  it('includes font field alongside text_uthmani for other fonts', () => {
    expect(buildVerseFields('text_indopak')).toBe('text_uthmani,text_indopak');
    expect(buildVerseFields('code_v2')).toBe('text_uthmani,code_v2');
  });
});

describe('extractVerseContent', () => {
  it('returns text_uthmani as arabic for text_uthmani font', () => {
    const { arabic } = extractVerseContent(baseVerse, 'text_uthmani', false);
    expect(arabic).toBe('الم');
  });

  it('returns font-specific field when present', () => {
    const verse: Verse = { ...baseVerse, text_indopak: 'الٓمٓ' };
    const { arabic } = extractVerseContent(verse, 'text_indopak', false);
    expect(arabic).toBe('الٓمٓ');
  });

  it('falls back to text_uthmani when font field is absent', () => {
    const { arabic } = extractVerseContent(baseVerse, 'text_indopak', false);
    expect(arabic).toBe('الم');
  });

  it('returns null translation when showTranslation is false', () => {
    const verse: Verse = {
      ...baseVerse,
      translations: [{ resource_id: 131, text: 'Alif, Lam, Meem.' }],
    };
    const { translation } = extractVerseContent(verse, 'text_uthmani', false);
    expect(translation).toBeNull();
  });

  it('returns translation text when showTranslation is true and field is present', () => {
    const verse: Verse = {
      ...baseVerse,
      translations: [{ resource_id: 131, text: 'Alif, Lam, Meem.' }],
    };
    const { translation } = extractVerseContent(verse, 'text_uthmani', true);
    expect(translation).toBe('Alif, Lam, Meem.');
  });

  it('returns null translation when showTranslation is true but no translations on verse', () => {
    const { translation } = extractVerseContent(baseVerse, 'text_uthmani', true);
    expect(translation).toBeNull();
  });
});
