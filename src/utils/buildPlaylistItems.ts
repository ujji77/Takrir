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
      textUthmani: verse.text_uthmani,
      repeatCount: repeatCounts[verse.verse_key] ?? 1,
    }));
}
