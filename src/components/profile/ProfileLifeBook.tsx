// @ts-nocheck
import React from 'react';

export interface LifeBookGroup {
  chapter_type: string;
  chapter_title: string;
  groups: { figureKey: string; entries: { title?: string; summary?: string; created_at?: string }[] }[];
}

export interface SoulVaultEntryItem {
  id: string;
  activity: string | null;
  duration_minutes: number | null;
  report: string;
  created_at: string;
}

export interface ProfileLifeBookProps {
  groupedLifeBook: LifeBookGroup[];
  lifeBookLoading: boolean;
  soulVaultEntries: SoulVaultEntryItem[];
  soulVaultLoading: boolean;
}

export const ProfileLifeBook: React.FC<ProfileLifeBookProps> = ({
  groupedLifeBook,
  lifeBookLoading,
  soulVaultEntries,
  soulVaultLoading,
}) => (
  <div className="profile-card rounded-[28px] border border-[#D4AF37]/12 bg-white/[0.02] backdrop-blur-[40px] p-8 mb-8">
    <p className="uppercase mb-4" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '8px', letterSpacing: '0.5em', color: 'rgba(212,175,55,0.6)' }}>◈ AKASHIC LIFE BOOK</p>
    {lifeBookLoading && (
      <div className="space-y-3 py-4">
        <div className="h-6 w-40 rounded bg-white/10 animate-pulse" />
        <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
      </div>
    )}
    {!lifeBookLoading && groupedLifeBook.length > 0 && (
      <div className="space-y-4 mb-8">
        {groupedLifeBook.map((chapter) => (
          <div key={chapter.chapter_type} className="rounded-2xl border border-[#D4AF37]/10 bg-white/[0.02] p-5 sm:p-6">
            <h3 className="text-white mb-3" style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '1.4rem' }}>{chapter.chapter_title}</h3>
            <div className="space-y-3">
              {chapter.groups.map((group) => (
                <div key={group.figureKey}>
                  <p className="text-white/60 text-[10px] font-bold tracking-wider uppercase mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>{group.figureKey}</p>
                  {group.entries.map((entry, idx) => (
                    <div key={idx} className="mt-2">
                      <p className="text-white/40 text-base italic leading-[1.7]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{entry.summary || entry.title || '—'}</p>
                      {entry.created_at && <span className="text-white/30 text-xs">{new Date(entry.created_at).toLocaleDateString()}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}
    {!lifeBookLoading && groupedLifeBook.length === 0 && (
      <p className="text-white/40 italic text-base leading-[1.7] mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>As you journey with SQI, key transmissions will appear here as living chapters.</p>
    )}
    <div>
      {soulVaultLoading && <span className="text-white/30 text-[10px] uppercase tracking-wider">Syncing…</span>}
      {!soulVaultLoading && soulVaultEntries.length === 0 && (
        <p className="text-white/40 italic text-base leading-[1.7]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>After each Soul Scan, SQI inscribes a Deep-Field Resonance report here.</p>
      )}
      {!soulVaultLoading && soulVaultEntries.length > 0 && (
        <div className="space-y-4">
          {soulVaultEntries.slice(0, 4).map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-[#D4AF37]/10 bg-white/[0.02] p-5 sm:p-6">
              <p className="text-white mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '1.4rem' }}>{entry.activity || 'Deep-Field Resonance'}</p>
              <p className="text-white/40 text-base italic leading-[1.7]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{entry.report}</p>
              <span className="text-white/30 text-xs mt-2 block">{new Date(entry.created_at).toLocaleDateString()}{entry.duration_minutes ? ` · ${entry.duration_minutes} min` : ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
