import type { LibraryArchive, Manuscript, Chapter, VedicBook } from '@/types/vedicTranslation';

const escapeBacktick = (s: string) => String(s).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
const escapeDouble = (s: string) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');

function formatChapter(ch: Chapter, indent: string): string {
  const lines: string[] = [];
  lines.push(`${indent}title: \`${escapeBacktick(ch.title)}\`,`);
  lines.push(`${indent}summary: \`${escapeBacktick(ch.summary)}\`,`);
  if (ch.verses?.length) {
    lines.push(`${indent}verses: [`);
    ch.verses.forEach((v, i) => {
      const comma = i < ch.verses!.length - 1 ? ',' : '';
      lines.push(`${indent}  { verse: ${v.verse}, sanskrit: "${escapeDouble(v.sanskrit)}", devanagari: "${escapeDouble(v.devanagari)}" }${comma}`);
    });
    lines.push(`${indent}]`);
  } else {
    lines.push(`${indent}verses: []`);
  }
  if (ch.commentaries?.length) {
    lines.push(`${indent}commentaries: [`);
    ch.commentaries.forEach((c, i) => {
      const comma = i < ch.commentaries!.length - 1 ? ',' : '';
      lines.push(`${indent}  \`${escapeBacktick(c)}\`${comma}`);
    });
    lines.push(`${indent}]`);
  }
  return lines.join('\n');
}

function formatManuscript(m: Manuscript, indent: string): string {
  const lines: string[] = [];
  lines.push(`${indent}frontMatter: {`);
  lines.push(`${indent}  editorialNote: \`${escapeBacktick(m.frontMatter.editorialNote)}\`,`);
  lines.push(`${indent}  aboutGuru: \`${escapeBacktick(m.frontMatter.aboutGuru)}\`,`);
  lines.push(`${indent}  foreword: \`${escapeBacktick(m.frontMatter.foreword)}\`,`);
  lines.push(`${indent}  introduction: {`);
  lines.push(`${indent}    main: "${escapeDouble(m.frontMatter.introduction.main)}",`);
  lines.push(`${indent}    subsections: [`);
  m.frontMatter.introduction.subsections.forEach((sub, i) => {
    const comma = i < m.frontMatter.introduction.subsections.length - 1 ? ',' : '';
    lines.push(`${indent}      { title: "${escapeDouble(sub.title)}", content: "${escapeDouble(sub.content)}" }${comma}`);
  });
  lines.push(`${indent}    ]`);
  lines.push(`${indent}  },`);
  lines.push(`${indent}  specialMessage: \`${escapeBacktick(m.frontMatter.specialMessage)}\``);
  lines.push(`${indent}},`);
  lines.push(`${indent}chapter1: {`);
  lines.push(formatChapter(m.chapter1, `${indent}  `));
  lines.push(`${indent}}`);
  if (m.chapters && Object.keys(m.chapters).length > 0) {
    const chaps = Object.entries(m.chapters)
      .filter(([k]) => k !== '1')
      .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10));
    lines.push(`${indent},chapters: {`);
    chaps.forEach(([num], i) => {
      const ch = m.chapters![parseInt(num, 10)];
      const comma = i < chaps.length - 1 ? ',' : '';
      lines.push(`${indent}  ${num}: {`);
      lines.push(formatChapter(ch, `${indent}    `));
      lines.push(`${indent}  }${comma}`);
    });
    lines.push(`${indent}}`);
  }
  return lines.join('\n');
}

export function generateVedicManuscriptTs(archive: LibraryArchive): string {
  const header = `import { Manuscript, VedicBook, LibraryArchive } from '@/types/vedicTranslation';

const BHAGAVAD_GITA_MANUSCRIPT: Manuscript = {
`;
  const bg = formatManuscript(archive[VedicBook.BHAGAVAD_GITA], '  ');
  const gurut = `};

const GURU_GITA_MANUSCRIPT: Manuscript = {
`;
  const gg = formatManuscript(archive[VedicBook.GURU_GITA], '  ');
  const bhagavatam = `};

const BHAGAVATAM_MANUSCRIPT: Manuscript = {
`;
  const sb = formatManuscript(archive[VedicBook.SHREEMAD_BHAGAVATAM], '  ');
  const footer = `};

export const INITIAL_ARCHIVE: LibraryArchive = {
  [VedicBook.BHAGAVAD_GITA]: BHAGAVAD_GITA_MANUSCRIPT,
  [VedicBook.GURU_GITA]: GURU_GITA_MANUSCRIPT,
  [VedicBook.SHREEMAD_BHAGAVATAM]: BHAGAVATAM_MANUSCRIPT
};
`;

  return header + bg + gurut + gg + bhagavatam + sb + footer;
}

export function downloadVedicManuscript(archive: LibraryArchive, filename = 'vedicManuscript.ts') {
  const content = generateVedicManuscriptTs(archive);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
