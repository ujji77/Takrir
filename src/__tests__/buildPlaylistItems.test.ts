import { buildPlaylistItems } from '../utils/buildPlaylistItems';
import type { Verse, AudioFile } from '../types/api';

const makeVerse = (verseNumber: number, extra: Partial<Verse> = {}): Verse => ({
  id: verseNumber,
  chapter_id: 2,
  verse_number: verseNumber,
  verse_key: `2:${verseNumber}`,
  text_uthmani: `arabic-${verseNumber}`,
  juz_number: 1,
  page_number: 1,
  ...extra,
});

const makeAudio = (verseNumber: number): AudioFile => ({
  verse_key: `2:${verseNumber}`,
  url: `https://audio/${verseNumber}.mp3`,
});

describe('buildPlaylistItems', () => {
  const verses = [makeVerse(1), makeVerse(2), makeVerse(3)];
  const audio = [makeAudio(1), makeAudio(2), makeAudio(3)];

  it('filters to the requested verse range', () => {
    const items = buildPlaylistItems(verses, audio, 1, 2, {});
    expect(items).toHaveLength(2);
    expect(items[0].verseKey).toBe('2:1');
    expect(items[1].verseKey).toBe('2:2');
  });

  it('uses default repeat count of 1', () => {
    const items = buildPlaylistItems(verses, audio, 1, 1, {});
    expect(items[0].repeatCount).toBe(1);
  });

  it('respects custom repeat counts', () => {
    const items = buildPlaylistItems(verses, audio, 1, 2, { '2:1': 3 });
    expect(items[0].repeatCount).toBe(3);
    expect(items[1].repeatCount).toBe(1);
  });

  it('sets url from audio map', () => {
    const items = buildPlaylistItems(verses, audio, 1, 1, {});
    expect(items[0].url).toBe('https://audio/1.mp3');
  });

  it('sets url to empty string when no audio for verse', () => {
    const items = buildPlaylistItems(verses, [], 1, 1, {});
    expect(items[0].url).toBe('');
  });

  it('stores text_uthmani in texts', () => {
    const items = buildPlaylistItems(verses, audio, 1, 1, {});
    expect(items[0].texts.text_uthmani).toBe('arabic-1');
  });

  it('stores additional font variants when present on verse', () => {
    const versesWithFonts = [makeVerse(1, { text_indopak: 'indopak-1' })];
    const items = buildPlaylistItems(versesWithFonts, audio, 1, 1, {});
    expect(items[0].texts.text_indopak).toBe('indopak-1');
  });

  it('always populates translation from verse data', () => {
    const versesWithTranslation = [
      makeVerse(1, { translations: [{ resource_id: 131, text: 'Alif, Lam, Meem.' }] }),
    ];
    const items = buildPlaylistItems(versesWithTranslation, audio, 1, 1, {});
    expect(items[0].translation).toBe('Alif, Lam, Meem.');
  });

  it('sets translation to null when verse has no translations', () => {
    const items = buildPlaylistItems(verses, audio, 1, 1, {});
    expect(items[0].translation).toBeNull();
  });
});
