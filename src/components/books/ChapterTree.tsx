import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus } from 'lucide-react';

interface Chapter {
  id: string;
  title: string;
  glyph: string;
  depth: number;
  parent_id: string | null;
  order_index: number;
  children?: Chapter[];
}

interface ChapterTreeProps {
  chapters: Chapter[];
  selectedChapterId: string | null;
  onSelectChapter: (id: string | null) => void;
  onAddSubChapter?: (parentId: string) => void;
  isAdmin: boolean;
  bookType: 'life_book' | 'akashic_codex';
}

function buildTree(flat: Chapter[]): Chapter[] {
  const map: Record<string, Chapter> = {};
  flat.forEach(c => { map[c.id] = { ...c, children: [] }; });
  const roots: Chapter[] = [];
  flat.forEach(c => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].children!.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });
  // Sort
  const sortNode = (nodes: Chapter[]) => {
    nodes.sort((a, b) => a.order_index - b.order_index);
    nodes.forEach(n => n.children && sortNode(n.children));
  };
  sortNode(roots);
  return roots;
}

function ChapterNode({
  chapter,
  selectedId,
  onSelect,
  onAddSub,
  isAdmin,
  depth = 0,
}: {
  chapter: Chapter;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddSub?: (parentId: string) => void;
  isAdmin: boolean;
  depth?: number;
}) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = chapter.children && chapter.children.length > 0;
  const isSelected = selectedId === chapter.id;

  return (
    <div className="select-none">
      <div
        className={`
          group flex items-center gap-2 px-3 py-2 rounded-2xl cursor-pointer transition-all duration-200
          ${isSelected
            ? 'bg-[rgba(212,175,55,0.15)] border border-[rgba(212,175,55,0.3)]'
            : 'hover:bg-[rgba(255,255,255,0.04)] border border-transparent'
          }
        `}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
        onClick={() => {
          onSelect(isSelected ? null : chapter.id);
          if (hasChildren) setOpen(!open);
        }}
      >
        {/* Expand arrow */}
        {hasChildren ? (
          <span
            className="text-[rgba(212,175,55,0.5)] w-3 shrink-0"
            onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
          >
            {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        ) : (
          <span className="w-3 shrink-0" />
        )}

        {/* Glyph */}
        <span className="text-xs shrink-0" style={{ opacity: 0.7 }}>
          {chapter.glyph}
        </span>

        {/* Title */}
        <span
          className={`text-xs font-medium leading-tight flex-1 ${
            isSelected ? 'text-[#D4AF37]' : 'text-[rgba(255,255,255,0.7)]'
          }`}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            letterSpacing: depth === 0 ? '0.02em' : '0',
            fontWeight: depth === 0 ? 700 : 500,
          }}
        >
          {chapter.title}
        </span>

        {/* Admin: add sub-chapter */}
        {isAdmin && depth < 3 && (
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity text-[rgba(212,175,55,0.4)] hover:text-[#D4AF37]"
            onClick={(e) => {
              e.stopPropagation();
              onAddSub && onAddSub(chapter.id);
            }}
            title="Add sub-chapter"
          >
            <Plus size={10} />
          </button>
        )}
      </div>

      {/* Children */}
      {open && hasChildren && (
        <div className="mt-0.5">
          {chapter.children!.map(child => (
            <ChapterNode
              key={child.id}
              chapter={child}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddSub={onAddSub}
              isAdmin={isAdmin}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChapterTree({
  chapters,
  selectedChapterId,
  onSelectChapter,
  onAddSubChapter,
  isAdmin,
}: ChapterTreeProps) {
  const tree = buildTree(chapters);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* All entries option */}
      <div
        className={`
          flex items-center gap-2 px-3 py-2 rounded-2xl cursor-pointer mb-1 transition-all
          ${selectedChapterId === null
            ? 'bg-[rgba(212,175,55,0.12)] border border-[rgba(212,175,55,0.25)]'
            : 'hover:bg-[rgba(255,255,255,0.04)] border border-transparent'
          }
        `}
        onClick={() => onSelectChapter(null)}
      >
        <span className="text-xs">⊛</span>
        <span
          className={`text-xs font-bold uppercase tracking-widest ${
            selectedChapterId === null ? 'text-[#D4AF37]' : 'text-[rgba(255,255,255,0.5)]'
          }`}
          style={{ fontSize: '9px', letterSpacing: '0.15em' }}
        >
          All Entries
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-[rgba(212,175,55,0.1)] mb-2" />

      {/* Chapter tree */}
      <div className="flex-1 overflow-y-auto space-y-0.5 custom-scrollbar pr-1">
        {tree.map(chapter => (
          <ChapterNode
            key={chapter.id}
            chapter={chapter}
            selectedId={selectedChapterId}
            onSelect={onSelectChapter}
            onAddSub={onAddSubChapter}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    </div>
  );
}
