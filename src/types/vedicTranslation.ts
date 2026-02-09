export enum VedicBook {
  BHAGAVAD_GITA = "Bhagavad Gita",
  GURU_GITA = "Guru Gita",
  SHREEMAD_BHAGAVATAM = "Shreemad Bhagavatam"
}

export interface Interaction {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    book: VedicBook;
    chapter: number;
    verse: number;
  };
}

export interface ManuscriptSubsection {
  title: string;
  content: string;
}

export interface Verse {
  verse: number;
  sanskrit: string;
  devanagari: string;
}

export interface Chapter {
  title: string;
  summary: string;
  verses: Verse[];
  commentaries?: string[];
}

export interface Manuscript {
  frontMatter: {
    editorialNote: string;
    aboutGuru: string;
    foreword: string;
    introduction: {
      main: string;
      subsections: ManuscriptSubsection[];
    };
    specialMessage: string;
  };
  chapter1: Chapter;
  /** Additional chapters (Bhagavad Gita has 18, etc.) */
  chapters?: Record<number, Chapter>;
}

export interface LibraryArchive {
  [VedicBook.BHAGAVAD_GITA]: Manuscript;
  [VedicBook.GURU_GITA]: Manuscript;
  [VedicBook.SHREEMAD_BHAGAVATAM]: Manuscript;
}

export interface ProjectState {
  currentBook: VedicBook;
  chapter: number;
  verse: number;
  interactionCount: number;
  mode?: 'INGESTION' | 'GENERATION';
}
