import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, Layers, Radio, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useStargateAccess } from '@/hooks/useStargateAccess';
import { SanskritVerse } from '@/components/scriptural/SanskritVerse';

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
  const { hasAccess } = useStargateAccess();
  const [wisdom, setWisdom] = useState<HiddenWisdom[]>([]);
  const [spheres, setSpheres] = useState<AngelicSphere[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSphere, setSelectedSphere] = useState<number | null>(null);

  useEffect(() => {
    if (!hasAccess) return;

    const fetchWisdom = async () => {
      const { data, error } = await supabase
        .from('hidden_wisdom_vault')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setWisdom(data);
      }

      const { data: sphereData } = await supabase
        .from('angelic_spheres')
        .select('*')
        .order('sphere_number', { ascending: true });

      if (sphereData) {
        setSpheres(sphereData);
      }

      setLoading(false);
    };

    fetchWisdom();
  }, [hasAccess]);

  if (!hasAccess) {
    return (
      <Card className="p-8 text-center">
        <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Access to Hidden Wisdom Vault requires Stargate membership.</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredWisdom = selectedSphere
    ? wisdom.filter(w => w.angelic_sphere === selectedSphere)
    : wisdom;

  return (
    <div className="space-y-6">
      {/* Angelic Hierarchy Navigation */}
      <Card className="bg-gradient-to-br from-purple-900/30 via-indigo-900/30 to-cyan-900/30 border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            The 9 Angelic Spheres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
            {spheres.map((sphere) => (
              <button
                key={sphere.sphere_number}
                onClick={() => setSelectedSphere(selectedSphere === sphere.sphere_number ? null : sphere.sphere_number)}
                className={`p-3 rounded-lg border transition-all ${
                  selectedSphere === sphere.sphere_number
                    ? 'bg-purple-500/30 border-purple-400'
                    : 'bg-background/40 border-border hover:border-purple-500/50'
                }`}
              >
                <div className="text-xs font-semibold text-center">{sphere.sphere_number}</div>
                <div className="text-[10px] text-muted-foreground text-center mt-1">
                  {sphere.name.split(' ')[0]}
                </div>
              </button>
            ))}
          </div>
          {selectedSphere && (
            <div className="mt-4 p-4 bg-background/40 rounded-lg">
              <h4 className="font-semibold mb-1">{ANGELIC_SPHERE_NAMES[selectedSphere]}</h4>
              <p className="text-sm text-muted-foreground">
                {spheres.find(s => s.sphere_number === selectedSphere)?.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wisdom Content */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Wisdom</TabsTrigger>
          <TabsTrigger value="acoustic">Acoustic Levitation</TabsTrigger>
          <TabsTrigger value="pyramid">Pyramid Wisdom</TabsTrigger>
          <TabsTrigger value="vedic">Vedic Secrets</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {filteredWisdom.map((item) => (
            <Card key={item.id} className="bg-background/40 border-purple-500/20">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  {item.angelic_sphere && (
                    <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300">
                      Sphere {item.angelic_sphere}: {ANGELIC_SPHERE_NAMES[item.angelic_sphere]}
                    </span>
                  )}
                </div>
                {item.frequency_hz && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Radio className="h-4 w-4" />
                    {item.frequency_hz} Hz
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {item.devanagari_script && (
                  <SanskritVerse
                    content={item.content}
                    devanagari={item.devanagari_script}
                    translation={item.translation || undefined}
                  />
                )}
                {!item.devanagari_script && (
                  <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
                    {item.content}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="acoustic" className="space-y-4 mt-4">
          {filteredWisdom
            .filter(w => w.content_type === 'acoustic_levitation')
            .map((item) => (
              <Card key={item.id} className="bg-background/40 border-purple-500/20">
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
                    {item.content}
                  </p>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="pyramid" className="space-y-4 mt-4">
          {filteredWisdom
            .filter(w => w.content_type === 'pyramid_wisdom')
            .map((item) => (
              <Card key={item.id} className="bg-background/40 border-purple-500/20">
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
                    {item.content}
                  </p>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="vedic" className="space-y-4 mt-4">
          {filteredWisdom
            .filter(w => w.content_type === 'vedic_secret')
            .map((item) => (
              <Card key={item.id} className="bg-background/40 border-purple-500/20">
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {item.devanagari_script ? (
                    <SanskritVerse
                      content={item.content}
                      devanagari={item.devanagari_script}
                      translation={item.translation || undefined}
                    />
                  ) : (
                    <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
                      {item.content}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};
