import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flame, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function MySacredFlame() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5 text-white/80" />
        </button>

        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-white/80" />
          <h1 className="text-xl font-semibold text-white">My Sacred Flame</h1>
        </div>
      </div>

      <Card className="bg-white/5 border-white/10 rounded-2xl">
        <CardContent className="p-4 space-y-3">
          <p className="text-white/80">
            This is your personal healing journey space — built for gentle daily progress.
          </p>

          <div className="text-white/60 text-sm">
            Next step: choose a short practice (2–10 min) to keep your flame glowing.
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              className="rounded-xl"
              onClick={() => navigate("/healing")}
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Start a Healing Session
            </Button>

            <Button
              variant="outline"
              className="rounded-xl border-white/15 text-white"
              onClick={() => navigate("/paths")}
            >
              View Healing Paths
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
