import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, Layers, Radio, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useStargateAccess } from '@/hooks/useStargateAccess';
import { SanskritVerse } from '@/components/scriptural/SanskritVerse';

const innerTabClass =
  'rounded-full text-[10px] font-extrabold tracking-[0.1em] uppercase py-2.5 px-4 ' +
  'data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-white/50';

interface HiddenWisdom {
  id: string;
  title: string;
  content_type: string;
  content: string;
  devanagari_script: string | null;
  translation: string | null;
  frequency_hz: number | null;
  angelic_sphere: number | null;
}

interface AngelicSphere {
  sphere_number: number;
  name: string;
  description: string;
  ui_layer: string;
  frequency_range: { min: number; max: number };
  color_theme: string;
}

const ANGELIC_SPHERE_NAMES: Record<number, string> = {
  1: 'Seraphim',
  2: 'Cherubim',
  3: 'Thrones',
  4: 'Dominions',
  5: 'Virtues',
  6: 'Powers',
  7: 'Principalities',
  8: 'Archangels',
  9: 'Guardian Angels'
};

export const HiddenWisdomVault: React.FC = () => {
  const { isStargateMember, loading: accessLoading } = useStargateAccess();
  const [wisdom, setWisdom] = useState<HiddenWisdom[]>([]);
  const [spheres, setSpheres] = useState<AngelicSphere[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSphere, setSelectedSphere] = useState<number | null>(null);

  useEffect(() => {
    if (!isStargateMember) return;

    const fetchWisdom = async () => {
      const { data, error } = await (supabase as any)
        .from('hidden_wisdom_vault')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setWisdom(data as HiddenWisdom[]);
      }

      const { data: sphereData } = await (supabase as any)
        .from('angelic_spheres')
        .select('*')
        .order('sphere_number', { ascending: true });

      if (sphereData) {
        setSpheres(sphereData as AngelicSphere[]);
      }

      setLoading(false);
    };

    fetchWisdom();
  }, [isStargateMember]);

  if (accessLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]/70" />
      </div>
    );
  }

  if (!isStargateMember) {
    return (
      <div className="card-glass !p-8 text-center">
        <Sparkles className="h-12 w-12 text-[#D4AF37]/25 mx-auto mb-4" />
        <p className="text-white/40">Access to Hidden Wisdom Vault requires Stargate membership.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]/70" />
      </div>
    );
  }

  const filteredWisdom = selectedSphere
    ? wisdom.filter(w => w.angelic_sphere === selectedSphere)
    : wisdom;

  // Fall back to the static 9-sphere map if the angelic_spheres table hasn't
  // synced yet, so the grid never renders empty.
  const sphereList = spheres.length > 0
    ? spheres
    : Object.entries(ANGELIC_SPHERE_NAMES).map(([num, name]) => ({
        sphere_number: Number(num),
        name,
        description: '',
        ui_layer: '',
        frequency_range: { min: 0, max: 0 },
        color_theme: 'gold',
      }));

  return (
    <div className="space-y-6">
      {/* Angelic Hierarchy Navigation */}
      <div className="card-glass !rounded-[32px] !p-6 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{ background: 'radial-gradient(ellipse at 30% 0%, rgba(212,175,55,0.08) 0%, transparent 60%)' }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-5">
            <Layers className="h-4 w-4 text-[#D4AF37]" />
            <h3 className="sqi-title text-base">The 9 Angelic Spheres</h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
            {sphereList.map((sphere) => {
              const isActive = selectedSphere === sphere.sphere_number;
              return (
                <button
                  key={sphere.sphere_number}
                  onClick={() => setSelectedSphere(isActive ? null : sphere.sphere_number)}
                  className={`p-3 rounded-2xl border transition-all duration-300 ${
                    isActive
                      ? 'bg-[#D4AF37] border-[#D4AF37] shadow-[0_8px_24px_rgba(212,175,55,0.3)]'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-[#D4AF37]/40'
                  }`}
                >
                  <div className={`text-xs font-black text-center ${isActive ? 'text-black' : 'text-[#D4AF37]'}`}>
                    {sphere.sphere_number}
                  </div>
                  <div className={`text-[9px] text-center mt-1 truncate ${isActive ? 'text-black/70' : 'text-white/40'}`}>
                    {sphere.name.split(' ')[0]}
                  </div>
                </button>
              );
            })}
          </div>
          {selectedSphere && (
            <div className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <h4 className="font-bold text-[#D4AF37] mb-1">{ANGELIC_SPHERE_NAMES[selectedSphere]}</h4>
              <p className="text-sm text-white/50">
                {spheres.find(s => s.sphere_number === selectedSphere)?.description || 'No description synced yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Wisdom Content */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="flex flex-wrap gap-2 bg-transparent p-0 h-auto justify-start">
          <TabsTrigger value="all" className={innerTabClass}>All Wisdom</TabsTrigger>
          <TabsTrigger value="acoustic" className={innerTabClass}>Acoustic Levitation</TabsTrigger>
          <TabsTrigger value="pyramid" className={innerTabClass}>Pyramid Wisdom</TabsTrigger>
          <TabsTrigger value="vedic" className={innerTabClass}>Vedic Secrets</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-5">
          {filteredWisdom.length === 0 && <EmptyWisdomState />}
          {filteredWisdom.map((item) => (
            <WisdomCard key={item.id} item={item} />
          ))}
        </TabsContent>

        <TabsContent value="acoustic" className="space-y-4 mt-5">
          {filteredWisdom.filter(w => w.content_type === 'acoustic_levitation').length === 0 && <EmptyWisdomState />}
          {filteredWisdom
            .filter(w => w.content_type === 'acoustic_levitation')
            .map((item) => (
              <WisdomCard key={item.id} item={item} />
            ))}
        </TabsContent>

        <TabsContent value="pyramid" className="space-y-4 mt-5">
          {filteredWisdom.filter(w => w.content_type === 'pyramid_wisdom').length === 0 && <EmptyWisdomState />}
          {filteredWisdom
            .filter(w => w.content_type === 'pyramid_wisdom')
            .map((item) => (
              <WisdomCard key={item.id} item={item} />
            ))}
        </TabsContent>

        <TabsContent value="vedic" className="space-y-4 mt-5">
          {filteredWisdom.filter(w => w.content_type === 'vedic_secret').length === 0 && <EmptyWisdomState />}
          {filteredWisdom
            .filter(w => w.content_type === 'vedic_secret')
            .map((item) => (
              <WisdomCard key={item.id} item={item} />
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const EmptyWisdomState: React.FC = () => (
  <div className="card-glass !p-8 text-center">
    <BookOpen className="h-10 w-10 text-[#D4AF37]/25 mx-auto mb-3" />
    <p className="text-white/40 text-sm">No wisdom entries here yet.</p>
  </div>
);

const WisdomCard: React.FC<{ item: HiddenWisdom }> = ({ item }) => (
  <div className="card-glass !rounded-[28px] !p-6">
    <div className="flex items-start justify-between gap-3 mb-1">
      <h3 className="text-lg font-bold text-white">{item.title}</h3>
      {item.angelic_sphere && (
        <span className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37] whitespace-nowrap">
          Sphere {item.angelic_sphere} · {ANGELIC_SPHERE_NAMES[item.angelic_sphere]}
        </span>
      )}
    </div>
    {item.frequency_hz && (
      <div className="flex items-center gap-2 text-sm text-[#22D3EE]/70 mb-4">
        <Radio className="h-4 w-4" />
        {item.frequency_hz} Hz
      </div>
    )}
    <div className="space-y-4">
      {item.devanagari_script ? (
        <SanskritVerse
          content={item.content}
          devanagari={item.devanagari_script}
          translation={item.translation || undefined}
        />
      ) : (
        <p className="text-white/70 leading-relaxed whitespace-pre-line">
          {item.content}
        </p>
      )}
    </div>
  </div>
);
