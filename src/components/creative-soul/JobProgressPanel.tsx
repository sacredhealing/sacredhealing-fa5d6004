import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Download, Play, Pause, AlertCircle, Loader2, Music, Mic, Drum, Guitar } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobProgressPanelProps {
  jobId: string;
  onRegenerate?: () => void;
}

interface JobData {
  id: string;
  status: string;
  error_message?: string;
  progress_step?: string;
  progress_percent?: number;
  updated_at: string;
}

interface OutputData {
  final_mix_url?: string;
  preview_url?: string;
  voice_only_url?: string;
  music_only_url?: string;
  stems?: Record<string, string>;
}

const STEP_ORDER = [
  "extracting_audio",
  "noise_cleanup",
  "pre_stem_separation",
  "selecting_style_sounds",
  "bpm_matching",
  "mixing",
  "mastering_landr",
  "uploading_outputs",
  "done",
] as const;

const STEP_LABELS: Record<string, string> = {
  extracting_audio: "Extracting audio from sources",
  noise_cleanup: "Cleaning up audio noise",
  pre_stem_separation: "Separating stems (input processing)",
  selecting_style_sounds: "Selecting meditation style sounds",
  bpm_matching: "Matching BPM to target tempo",
  mixing: "Mixing voice with music & ambience",
  mastering_landr: "Professional LANDR mastering",
  uploading_outputs: "Uploading final outputs",
  done: "Complete!",
  queued: "Queued for processing",
  processing: "Processing...",
  browser_processing: "Ready! Use the Real-Time Player below",
};

const STEM_ICONS: Record<string, React.ReactNode> = {
  vocals: <Mic className="h-4 w-4" />,
  drums: <Drum className="h-4 w-4" />,
  bass: <Guitar className="h-4 w-4" />,
  music: <Music className="h-4 w-4" />,
  other: <Music className="h-4 w-4" />,
};

export default function JobProgressPanel({ jobId, onRegenerate }: JobProgressPanelProps) {
  const [job, setJob] = useState<JobData | null>(null);
  const [outputs, setOutputs] = useState<OutputData | null>(null);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const percent = useMemo(() => {
    // Browser fallback should always show 100%
    if (job?.status === "browser_processing") return 100;
    if (job?.status === "completed" || job?.status === "done") return 100;
    if (typeof job?.progress_percent === "number" && job.progress_percent > 0) return job.progress_percent;
    const idx = STEP_ORDER.indexOf(job?.progress_step as typeof STEP_ORDER[number]);
    if (idx >= 0) return Math.round((idx / (STEP_ORDER.length - 1)) * 100);
    if (job?.status === "processing") return 10;
    return 5;
  }, [job]);

  const stepLabel = useMemo(() => {
    // Check for RapidAPI subscription error in error_message
    if (job?.error_message?.includes("RapidAPI") || 
        job?.error_message?.includes("subscription") ||
        job?.error_message?.includes("quota")) {
      return "⚠️ Audio processing service unavailable. Check RapidAPI subscription.";
    }
    if (job?.progress_step && STEP_LABELS[job.progress_step]) {
      return STEP_LABELS[job.progress_step];
    }
    if (job?.status && STEP_LABELS[job.status]) {
      return STEP_LABELS[job.status];
    }
    return "Processing...";
  }, [job]);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      setError("");
      const { data: j, error: je } = await supabase
        .from("creative_soul_jobs")
        .select("id,status,error_message,progress_step,progress_percent,updated_at")
        .eq("job_id", jobId)
        .single();

      if (cancelled) return;
      if (je) {
        setError(je.message);
        return;
      }

      setJob(j as JobData);

      if (j?.status === "completed" || j?.status === "done") {
        const { data: out } = await supabase
          .from("creative_soul_outputs")
          .select("output")
          .eq("job_id", j.id)
          .single();
        if (!cancelled && out) {
          setOutputs((out as { output: OutputData }).output ?? null);
        }
      }
    }

    const interval = setInterval(tick, 2500);
    tick();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId]);

  const handlePlayPause = () => {
    if (!audioRef) return;
    if (isPlaying) {
      audioRef.pause();
    } else {
      audioRef.play();
    }
    setIsPlaying(!isPlaying);
  };

  const audioUrl = outputs?.preview_url || outputs?.final_mix_url;

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!job) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading job status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (job.status === "failed" || job.status === "error") {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Generation Failed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{job.error_message || "An unknown error occurred"}</p>
          {onRegenerate && (
            <Button onClick={onRegenerate} variant="outline">
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const isComplete = ["completed", "done", "browser_processing"].includes(job.status);
  const isBrowserFallback = job.status === "browser_processing";

  return (
    <Card className={cn(
      "transition-all",
      isComplete && !isBrowserFallback && "border-primary/50 bg-primary/5",
      isBrowserFallback && "border-green-500/50 bg-green-500/10"
    )}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {isBrowserFallback 
              ? "🎧 Real-Time Player Ready!" 
              : isComplete 
                ? "✨ Meditation Ready!" 
                : "Generating Meditation..."}
          </span>
          <span className="text-2xl font-bold text-primary">{percent}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Browser fallback message */}
        {isBrowserFallback && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-green-500/20 border border-green-500/30">
              <p className="text-green-200 font-medium mb-2">
                ✅ Cloud processing unavailable – use the Real-Time Player below!
              </p>
              <p className="text-sm text-muted-foreground">
                The browser-based meditation generator creates beautiful ambient soundscapes 
                in real-time. Scroll down to find the Real-Time Meditation Player and start generating.
              </p>
            </div>
            <Button 
              onClick={() => {
                const player = document.getElementById('browser-meditation-player');
                player?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="w-full gap-2"
            >
              <Play className="h-4 w-4" />
              Scroll to Real-Time Player
            </Button>
          </div>
        )}

        {/* Progress bar - only show when not browser fallback */}
        {!isBrowserFallback && (
          <div className="space-y-2">
            <Progress value={percent} className="h-3" />
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              {!isComplete && <Loader2 className="h-4 w-4 animate-spin" />}
              {stepLabel}
            </p>
          </div>
        )}

        {/* Step indicators */}
        {!isComplete && (
          <div className="grid grid-cols-4 gap-2 text-xs">
            {STEP_ORDER.slice(0, 8).map((step, idx) => {
              const currentIdx = STEP_ORDER.indexOf(job.progress_step as typeof STEP_ORDER[number]);
              const isActive = step === job.progress_step;
              const isDone = currentIdx > idx;
              
              return (
                <div
                  key={step}
                  className={cn(
                    "p-2 rounded text-center transition-colors",
                    isActive && "bg-primary/20 text-primary font-medium",
                    isDone && "bg-muted text-muted-foreground line-through",
                    !isActive && !isDone && "bg-muted/50 text-muted-foreground/50"
                  )}
                >
                  {STEP_LABELS[step]?.split(" ")[0] || step.replace(/_/g, " ")}
                </div>
              );
            })}
          </div>
        )}

        {/* Audio preview and downloads - only for cloud processing */}
        {isComplete && !isBrowserFallback && outputs && (
          <div className="space-y-4">
            {/* Audio player */}
            {audioUrl && (
              <div className="space-y-2">
                <audio
                  ref={setAudioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
                <Button
                  onClick={handlePlayPause}
                  variant="outline"
                  size="lg"
                  className="w-full gap-2"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  {isPlaying ? "Pause Preview" : "Play Preview"}
                </Button>
              </div>
            )}

            {/* Main downloads */}
            <div className="grid grid-cols-2 gap-3">
              {outputs.final_mix_url && (
                <Button asChild className="gap-2">
                  <a href={outputs.final_mix_url} download>
                    <Download className="h-4 w-4" />
                    Final Mix
                  </a>
                </Button>
              )}
              {outputs.voice_only_url && (
                <Button asChild variant="outline" className="gap-2">
                  <a href={outputs.voice_only_url} download>
                    <Mic className="h-4 w-4" />
                    Voice Only
                  </a>
                </Button>
              )}
              {outputs.music_only_url && (
                <Button asChild variant="outline" className="gap-2">
                  <a href={outputs.music_only_url} download>
                    <Music className="h-4 w-4" />
                    Music Only
                  </a>
                </Button>
              )}
            </div>

            {/* Stems */}
            {outputs.stems && Object.keys(outputs.stems).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Download Stems</h4>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(outputs.stems).map(([name, url]) => (
                    <Button
                      key={name}
                      asChild
                      variant="secondary"
                      size="sm"
                      className="gap-2"
                    >
                      <a href={url} download>
                        {STEM_ICONS[name] || <Music className="h-4 w-4" />}
                        {name}
                      </a>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Regenerate section */}
            {onRegenerate && (
              <div className="pt-4 border-t">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Not happy with the result?</p>
                  <Button onClick={onRegenerate} variant="outline" className="gap-2">
                    🔄 Regenerate with Different Settings
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
