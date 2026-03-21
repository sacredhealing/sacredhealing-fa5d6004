import type { Chapter, Manuscript } from '@/types/vedicTranslation';
import type { BookChapter } from '@/hooks/useScripturalBooks';

export function collectManuscriptChapters(manuscript: Manuscript): { num: number; chapter: Chapter }[] {
  const map = new Map<number, Chapter>();
  map.set(1, manuscript.chapter1);
  if (manuscript.chapters) {
    for (const [key, ch] of Object.entries(manuscript.chapters)) {
      const n = parseInt(key, 10);
      if (!Number.isNaN(n)) map.set(n, ch);
    }
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([num, chapter]) => ({ num, chapter }));
}

export type BookChapterInsert = {
  book_id: string;
  chapter_number: number;
  title: string | null;
  theme: string | null;
  summary: string | null;
  content: BookChapter['content'];
};

/**
 * Flatten vedic translation archive manuscript into book_chapters rows + verse count.
 */
export function buildBookChapterRowsFromManuscript(
  bookId: string,
  manuscript: Manuscript
): { rows: BookChapterInsert[]; totalChapters: number; totalVerses: number } {
  const pairs = collectManuscriptChapters(manuscript);
  let totalVerses = 0;
  const rows: BookChapterInsert[] = pairs.map(({ num, chapter }) => {
    const content: BookChapter['content'] = [];
    for (const v of chapter.verses || []) {
      totalVerses += 1;
      content.push({
        type: 'VERSE',
        content: (v.sanskrit || '').trim() || '—',
        devanagari: v.devanagari?.trim() || undefined,
        translation: null,
      });
    }
    for (const c of chapter.commentaries || []) {
      const t = (c || '').trim();
      if (t) content.push({ type: 'TEACHING', content: t });
    }
    return {
      book_id: bookId,
      chapter_number: num,
      title: chapter.title?.trim() || null,
      theme: null,
      summary: chapter.summary?.trim() || null,
      content,
    };
  });
  return { rows, totalChapters: rows.length, totalVerses };
}
