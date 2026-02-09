import React, { useState, useEffect } from 'react';
import type { Manuscript } from '@/types/vedicTranslation';

interface Props {
  manuscript: Manuscript;
  onUpdateManuscript: (newManuscript: Manuscript) => void;
  onClose: () => void;
}

export const ArchiveModal: React.FC<Props> = ({ manuscript, onUpdateManuscript, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedManuscript, setEditedManuscript] = useState<Manuscript>(manuscript);

  useEffect(() => {
    setEditedManuscript(manuscript);
  }, [manuscript]);

  const handleSave = () => {
    onUpdateManuscript(editedManuscript);
    setIsEditing(false);
  };

  const updateField = (path: string, value: unknown) => {
    const keys = path.split('.');
    const newManuscript = JSON.parse(JSON.stringify(editedManuscript));
    let current: Record<string, unknown> = newManuscript;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]] as Record<string, unknown>;
    }
    current[keys[keys.length - 1]] = value;
    setEditedManuscript(newManuscript as Manuscript);
  };

  const renderTitle = (title: string) => (
    <h2 className="cinzel text-2xl sacred-gold font-bold mt-12 mb-8 tracking-[0.3em] flex justify-center items-center gap-4 uppercase sacred-gold-glow">
      {title}
    </h2>
  );

  const renderText = (text: string, path: string, italic = false) => (
    <div className={`text-slate-200 leading-[2] text-lg text-justify max-w-3xl mx-auto mb-10 ${italic ? 'italic font-light opacity-80' : 'font-light'}`}>
      {isEditing ? (
        <textarea
          value={text}
          onChange={(e) => updateField(path, e.target.value)}
          rows={Math.max(3, text.split('\n').length)}
          className="w-full bg-white/5 border border-amber-500/20 rounded-lg p-4 font-light text-slate-100 outline-none focus:border-amber-500/50"
        />
      ) : (
        text.split('\n').map((p, i) => (
          <p key={i} className="mb-6 last:mb-0 whitespace-pre-wrap">{p}</p>
        ))
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-md overflow-hidden">
      <div className="royal-card w-full max-w-6xl h-full flex flex-col rounded-3xl overflow-hidden border border-amber-500/20 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/40">
          <div className="flex flex-col">
            <span className="text-[10px] cinzel tracking-[0.5em] text-amber-500/60 uppercase">Sacred Sanctum</span>
            <h3 className="cinzel text-lg font-bold tracking-[0.2em] text-white uppercase">Sacred Archive: Master Manuscript</h3>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`px-6 py-2 rounded-full border transition-all cinzel text-xs tracking-widest uppercase ${isEditing ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold hover:bg-amber-400' : 'border-white/10 text-slate-400 hover:border-amber-500/30 hover:text-amber-400'}`}
            >
              {isEditing ? 'Save Changes' : 'Enter Edit Mode'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-full border border-white/10 hover:border-amber-500/30 transition-all group"
            >
              <span className="cinzel text-xs tracking-widest text-slate-400 group-hover:text-amber-400 uppercase">Exit Archive</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8 md:px-24 md:py-16 bg-slate-950/30">
          <div className="max-w-4xl mx-auto space-y-20">
            <section className="pt-8 mb-24 pb-12 border-b border-white/5">
              <div className="text-center mb-16">
                <span className="text-[10px] cinzel text-amber-500 tracking-[0.8em] uppercase block mb-4">Latest Additions</span>
                <h2 className="cinzel text-3xl text-white font-bold tracking-[0.4em]">SACRED INFLOW</h2>
              </div>
              {(!editedManuscript.chapter1.commentaries || editedManuscript.chapter1.commentaries.length === 0) ? (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                  <p className="cinzel text-[10px] tracking-[0.4em] text-white/20 uppercase">Awaiting new manuscript entries from the console...</p>
                </div>
              ) : (
                <div className="space-y-12">
                  {editedManuscript.chapter1.commentaries.map((comm, idx) => (
                    <div key={idx} className="bg-white/5 p-10 rounded-3xl border border-white/10 relative group hover:border-amber-500/20 transition-all">
                      <div className="absolute -top-3 left-8 px-3 bg-slate-900 text-[8px] cinzel text-amber-500 font-bold tracking-[0.6em] uppercase">Entry {idx + 1}</div>
                      <div className="text-slate-100/80 leading-[1.8] text-lg font-light italic">
                        {comm.split('\n').map((line, li) => (
                          <p key={li} className="mb-4 last:mb-0">{line}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="text-center">
              {renderTitle("REDATIONELL ANMÄRKNING")}
              {renderText(editedManuscript.frontMatter.editorialNote, "frontMatter.editorialNote", true)}
            </section>
            <section>
              {renderTitle("OM PARAMAHAMSA VISHWANANDA")}
              {renderText(editedManuscript.frontMatter.aboutGuru, "frontMatter.aboutGuru")}
            </section>
            <section>
              {renderTitle("FÖRORD")}
              {renderText(editedManuscript.frontMatter.foreword, "frontMatter.foreword")}
            </section>
            <section>
              {renderTitle("INTRODUKTION")}
              {renderText(editedManuscript.frontMatter.introduction.main, "frontMatter.introduction.main")}
              <div className="space-y-12 pl-4 border-l border-amber-500/10">
                {editedManuscript.frontMatter.introduction.subsections.map((sub, idx) => (
                  <div key={idx} className="animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 150}ms` } as React.CSSProperties}>
                    {isEditing ? (
                      <div className="space-y-4 mb-4">
                        <input
                          value={sub.title}
                          onChange={(e) => {
                            const newSubs = [...editedManuscript.frontMatter.introduction.subsections];
                            newSubs[idx] = { ...newSubs[idx], title: e.target.value };
                            updateField("frontMatter.introduction.subsections", newSubs);
                          }}
                          className="cinzel text-sm font-bold sacred-gold bg-white/5 border border-amber-500/20 rounded-lg p-2 w-full uppercase outline-none focus:border-amber-500/50"
                        />
                        <textarea
                          value={sub.content}
                          onChange={(e) => {
                            const newSubs = [...editedManuscript.frontMatter.introduction.subsections];
                            newSubs[idx] = { ...newSubs[idx], content: e.target.value };
                            updateField("frontMatter.introduction.subsections", newSubs);
                          }}
                          rows={6}
                          className="w-full bg-white/5 border border-amber-500/20 rounded-lg p-4 font-light text-slate-100 outline-none focus:border-amber-500/50 text-sm"
                        />
                      </div>
                    ) : (
                      <>
                        <h4 className="cinzel text-sm font-bold sacred-gold mb-4 tracking-[0.2em] uppercase sacred-gold-glow">{sub.title}</h4>
                        {renderText(sub.content, `frontMatter.introduction.subsections.${idx}.content`)}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>
            <section>
              {renderTitle("SÄRSKILT MEDDELANDE FRÅN PARAMAHAMSA VISHWANANDA")}
              <div className="bg-amber-500/5 p-12 rounded-2xl border border-amber-500/10 italic text-amber-100/90 leading-loose text-center text-xl font-serif">
                {isEditing ? (
                  <textarea
                    value={editedManuscript.frontMatter.specialMessage}
                    onChange={(e) => updateField("frontMatter.specialMessage", e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-center h-48 resize-none p-4"
                  />
                ) : (
                  `"${editedManuscript.frontMatter.specialMessage}"`
                )}
              </div>
            </section>
            <section className="pt-24 border-t border-white/5">
              {isEditing ? (
                <div className="space-y-4 text-center">
                  <input
                    value={editedManuscript.chapter1.title}
                    onChange={(e) => updateField("chapter1.title", e.target.value)}
                    className="cinzel text-2xl sacred-gold font-bold bg-white/5 border border-amber-500/20 rounded-lg p-4 w-full text-center uppercase outline-none focus:border-amber-500/50"
                  />
                  <textarea
                    value={editedManuscript.chapter1.summary}
                    onChange={(e) => updateField("chapter1.summary", e.target.value)}
                    rows={12}
                    className="w-full bg-white/5 border border-amber-500/20 rounded-lg p-4 font-light text-slate-100 outline-none focus:border-amber-500/50 text-lg leading-relaxed text-justify"
                  />
                </div>
              ) : (
                <>
                  {renderTitle(editedManuscript.chapter1.title)}
                  {renderText(editedManuscript.chapter1.summary, "chapter1.summary")}
                </>
              )}
            </section>
            <section className="pt-24 border-t border-white/5 pb-24">
              <div className="text-center mb-16">
                <span className="text-[10px] cinzel text-amber-500/40 tracking-[0.8em] uppercase block mb-4">Master Record</span>
                <h2 className="cinzel text-3xl text-white font-bold tracking-[0.4em]">SCRIPTURAL BEDROCK</h2>
              </div>
              <div className="space-y-20">
                {editedManuscript.chapter1.verses.map((v, idx) => (
                  <div key={v.verse} className="group relative">
                    <div className="absolute -left-12 top-0 text-[10px] cinzel text-amber-500/20 font-bold rotate-90 origin-left">
                      CH1-V{v.verse}
                    </div>
                    <div className="text-center space-y-4">
                      {isEditing ? (
                        <div className="space-y-4">
                          <textarea
                            value={v.sanskrit}
                            onChange={(e) => {
                              const newChapterVerses = [...editedManuscript.chapter1.verses];
                              newChapterVerses[idx] = { ...newChapterVerses[idx], sanskrit: e.target.value };
                              updateField("chapter1.verses", newChapterVerses);
                            }}
                            className="w-full bg-white/5 border border-amber-500/20 rounded-lg p-2 text-center text-amber-200/40 italic font-serif"
                          />
                          <textarea
                            value={v.devanagari}
                            onChange={(e) => {
                              const newChapterVerses = [...editedManuscript.chapter1.verses];
                              newChapterVerses[idx] = { ...newChapterVerses[idx], devanagari: e.target.value };
                              updateField("chapter1.verses", newChapterVerses);
                            }}
                            className="w-full bg-white/5 border border-amber-500/20 rounded-lg p-2 text-center text-amber-100 font-bold text-2xl"
                          />
                        </div>
                      ) : (
                        <>
                          <p className="italic text-amber-200/40 text-lg mb-4 font-serif tracking-widest whitespace-pre-line leading-relaxed">
                            {v.sanskrit}
                          </p>
                          <p className="font-bold text-amber-100 text-2xl tracking-[0.1em] mb-4 whitespace-pre-line">
                            {v.devanagari}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
