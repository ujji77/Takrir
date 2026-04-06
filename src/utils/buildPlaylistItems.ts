import type { Verse, AudioFile } from '../types/api';
import type { PlaylistItem } from '../store/playlist';

export function buildPlaylistItems(
  verses: Verse[],
  audioFiles: AudioFile[],
  fromVerse: number,
  toVerse: number,
  repeatCounts: Record<string, number>,
): PlaylistItem[] {
  const audioMap = new Map(audioFiles.map((f) => [f.verse_key, f.url]));
  return verses
    .filter((v) => v.verse_number >= fromVerse && v.verse_number <= toVerse)
    .map((verse) => ({
      verseKey: verse.verse_key,
      url: audioMap.get(verse.verse_key) ?? '',
      texts: {
        text_uthmani: verse.text_uthmani,
        ...(verse.text_indopak ? { text_indopak: verse.text_indopak } : {}),
        ...(verse.text_imlaei ? { text_imlaei: verse.text_imlaei } : {}),
        ...(verse.code_v1 ? { code_v1: verse.code_v1 } : {}),
        ...(verse.code_v2 ? { code_v2: verse.code_v2 } : {}),
      },
      translation: verse.translations?.[0]?.text ?? null,
      repeatCount: repeatCounts[verse.verse_key] ?? 1,
    }));
}
