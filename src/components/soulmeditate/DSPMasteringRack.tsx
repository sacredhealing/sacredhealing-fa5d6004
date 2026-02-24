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
    <Card className="bg-[#0B0112]/60 backdrop-blur-xl border-amber-900/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-amber-100/90">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <Waves className="w-5 h-5 text-amber-400" />
          </div>
          Sacred Effects
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-8 px-3 sm:px-6">
        {/* Sacred Reverb (Convolution / Temple) */}
        <div className="p-3 sm:p-4 rounded-xl bg-amber-900/10 border border-amber-900/20 space-y-3 sm:space-y-4">
          <div className="flex items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shrink-0">
                <Waves className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              </div>
              <div className="min-w-0">
                <Label className="text-amber-100/90 font-medium text-sm">Sacred Reverb</Label>
                <p className="text-[10px] sm:text-xs text-amber-200/50">Temple space convolution</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {dsp.reverb.enabled && (
                <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-400 px-1.5">
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
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] sm:text-xs">
                  <span className="text-amber-200/60">Decay</span>
                  <span className="text-amber-200/80">{dsp.reverb.decay.toFixed(1)}s</span>
                </div>
                <Slider
                  value={[dsp.reverb.decay]}
                  min={0.5}
                  max={8}
                  step={0.1}
                  onValueChange={([decay]) => onUpdate({ reverb: { ...dsp.reverb, decay } })}
                  className="[&_[role=slider]]:bg-amber-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] sm:text-xs">
                  <span className="text-amber-200/60">Wet Mix</span>
                  <span className="text-amber-200/80">{Math.round(dsp.reverb.wet * 100)}%</span>
                </div>
                <Slider
                  value={[dsp.reverb.wet]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={([wet]) => onUpdate({ reverb: { ...dsp.reverb, wet } })}
                  className="[&_[role=slider]]:bg-amber-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sacred Echo (Tape-style delay) */}
        <div className="p-3 sm:p-4 rounded-xl bg-amber-900/10 border border-amber-900/20 space-y-3 sm:space-y-4 mt-2">
          <div className="flex items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center shrink-0">
                <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
              </div>
              <div className="min-w-0">
                <Label className="text-amber-100/90 font-medium text-sm">Sacred Echo</Label>
                <p className="text-[10px] sm:text-xs text-amber-200/50">Tape-style delay with high-cut</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {dsp.delay.enabled && (
                <Badge variant="outline" className="text-[10px] border-orange-500/50 text-orange-400 px-1.5">
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
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between text-[10px] sm:text-xs">
                  <span className="text-amber-200/60">Time</span>
                  <span className="text-amber-200/80">{(dsp.delay.time * 1000).toFixed(0)}ms</span>
                </div>
                <Slider
                  value={[dsp.delay.time]}
                  min={0.05}
                  max={1}
                  step={0.01}
                  onValueChange={([time]) => onUpdate({ delay: { ...dsp.delay, time } })}
                  className="[&_[role=slider]]:bg-orange-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between text-[10px] sm:text-xs">
                  <span className="text-amber-200/60">Feedback</span>
                  <span className="text-amber-200/80">{Math.round(dsp.delay.feedback * 100)}%</span>
                </div>
                <Slider
                  value={[dsp.delay.feedback]}
                  min={0}
                  max={0.9}
                  step={0.01}
                  onValueChange={([feedback]) => onUpdate({ delay: { ...dsp.delay, feedback } })}
                  className="[&_[role=slider]]:bg-orange-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between text-[10px] sm:text-xs">
                  <span className="text-amber-200/60">Wet</span>
                  <span className="text-amber-200/80">{Math.round(dsp.delay.wet * 100)}%</span>
                </div>
                <Slider
                  value={[dsp.delay.wet]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={([wet]) => onUpdate({ delay: { ...dsp.delay, wet } })}
                  className="[&_[role=slider]]:bg-orange-500"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
