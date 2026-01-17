import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Waves, Timer } from 'lucide-react';
import type { DSPSettings } from '@/hooks/useSoulMeditateEngine';

interface DSPMasteringRackProps {
  dsp: DSPSettings;
  onUpdate: (dsp: Partial<DSPSettings>) => void;
}

export default function DSPMasteringRack({ dsp, onUpdate }: DSPMasteringRackProps) {
  return (
    <Card className="bg-black/40 backdrop-blur-xl border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-white/90">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
            <Waves className="w-5 h-5 text-purple-400" />
          </div>
          DSP Mastering Rack
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reverb */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <Waves className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <Label className="text-white/90 font-medium">Sacred Reverb</Label>
                <p className="text-xs text-white/50">Cathedral space simulation</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {dsp.reverb.enabled && (
                <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-400">
                  Active
                </Badge>
              )}
              <Switch
                checked={dsp.reverb.enabled}
                onCheckedChange={(enabled) => onUpdate({ reverb: { ...dsp.reverb, enabled } })}
              />
            </div>
          </div>
          
          {dsp.reverb.enabled && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Decay</span>
                  <span className="text-white/80">{dsp.reverb.decay.toFixed(1)}s</span>
                </div>
                <Slider
                  value={[dsp.reverb.decay]}
                  min={0.5}
                  max={8}
                  step={0.1}
                  onValueChange={([decay]) => onUpdate({ reverb: { ...dsp.reverb, decay } })}
                  className="[&_[role=slider]]:bg-blue-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Wet Mix</span>
                  <span className="text-white/80">{Math.round(dsp.reverb.wet * 100)}%</span>
                </div>
                <Slider
                  value={[dsp.reverb.wet]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={([wet]) => onUpdate({ reverb: { ...dsp.reverb, wet } })}
                  className="[&_[role=slider]]:bg-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Delay */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center">
                <Timer className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <Label className="text-white/90 font-medium">Echo Chamber</Label>
                <p className="text-xs text-white/50">Temporal reflections</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {dsp.delay.enabled && (
                <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-400">
                  Active
                </Badge>
              )}
              <Switch
                checked={dsp.delay.enabled}
                onCheckedChange={(enabled) => onUpdate({ delay: { ...dsp.delay, enabled } })}
              />
            </div>
          </div>
          
          {dsp.delay.enabled && (
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Time</span>
                  <span className="text-white/80">{(dsp.delay.time * 1000).toFixed(0)}ms</span>
                </div>
                <Slider
                  value={[dsp.delay.time]}
                  min={0.05}
                  max={1}
                  step={0.01}
                  onValueChange={([time]) => onUpdate({ delay: { ...dsp.delay, time } })}
                  className="[&_[role=slider]]:bg-cyan-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Feedback</span>
                  <span className="text-white/80">{Math.round(dsp.delay.feedback * 100)}%</span>
                </div>
                <Slider
                  value={[dsp.delay.feedback]}
                  min={0}
                  max={0.9}
                  step={0.01}
                  onValueChange={([feedback]) => onUpdate({ delay: { ...dsp.delay, feedback } })}
                  className="[&_[role=slider]]:bg-cyan-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Wet</span>
                  <span className="text-white/80">{Math.round(dsp.delay.wet * 100)}%</span>
                </div>
                <Slider
                  value={[dsp.delay.wet]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={([wet]) => onUpdate({ delay: { ...dsp.delay, wet } })}
                  className="[&_[role=slider]]:bg-cyan-500"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
