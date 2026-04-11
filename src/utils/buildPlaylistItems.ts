import type { Verse, AudioFile } from '../types/api';
import type { PlaylistItem } from '../store/playlist';

export function buildPlaylistItems(
  verses: Verse[],
  audioByReciter: Record<number, AudioFile[]>,
  fromVerse: number,
  toVerse: number,
  repeatCounts: Record<string, number>,
  chapterName: string,
): PlaylistItem[] {
  // Build a lookup map per reciter: verseKey → url
  const audioMaps: Record<number, Map<string, string>> = {};
  for (const [id, files] of Object.entries(audioByReciter)) {
    audioMaps[Number(id)] = new Map(files.map((f) => [f.verse_key, f.url]));
  }

  return verses
    .filter((v) => v.verse_number >= fromVerse && v.verse_number <= toVerse)
    .map((verse) => {
      const audioUrls: Record<number, string> = {};
      for (const [id, map] of Object.entries(audioMaps)) {
        const url = map.get(verse.verse_key);
        if (url) audioUrls[Number(id)] = url;
      }
      return {
        verseKey: verse.verse_key,
        chapterName,
        audioUrls,
        text_uthmani: verse.text_uthmani,
        text_indopak: verse.text_indopak ?? null,
        translation: verse.translations?.[0]?.text?.replace(/<[^>]+>/g, '') ?? null,
        repeatCount: repeatCounts[verse.verse_key] ?? 1,
      };
    });
}
