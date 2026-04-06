export interface TranslatedName {
  language_name: string;
  name: string;
}

export interface Chapter {
  id: number;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: number[];
  translated_name: TranslatedName;
}

export type QuranFont = 'text_uthmani' | 'text_indopak';

export interface VerseTranslation {
  resource_id: number;
  text: string;
}

export interface Verse {
  id: number;
  chapter_id: number;
  verse_number: number;
  verse_key: string;
  text_uthmani: string;
  text_indopak?: string;
  juz_number: number;
  page_number: number;
  translations?: VerseTranslation[];
}

export interface Pagination {
  per_page: number;
  current_page: number;
  next_page: number | null;
  total_pages: number;
  total_records: number;
}

export interface AudioFile {
  verse_key: string;
  url: string;
}

export interface AudioFilesResponse {
  audio_files: AudioFile[];
  meta: {
    reciter_name: string;
    recitation_style: string | null;
  };
}

export interface Recitation {
  id: number;
  reciter_name: string;
  style: string | null;
  translated_name: TranslatedName;
}

export interface RecitationsResponse {
  recitations: Recitation[];
}

export interface ChaptersResponse {
  chapters: Chapter[];
}

export interface VersesResponse {
  verses: Verse[];
  pagination: Pagination;
}
