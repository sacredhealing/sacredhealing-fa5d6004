import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MembershipHub({ onManage }: { onManage: () => void }) {
  const navigate = useNavigate();
  const [openOptional, setOpenOptional] = useState(false);

  return (
    <div className="px-4 pb-24">
      {/* Header */}
      <div className="pt-6 text-center">
        <div className="text-2xl font-bold text-white">Your Space</div>
        <div className="mt-1 text-sm text-white/60">Your membership is active.</div>

        <div className="mt-4 flex justify-center gap-3">
          <Button
            onClick={() => navigate("/library")}
            className="rounded-full px-5 py-3 text-sm font-semibold"
          >
            Continue
          </Button>
          <Button
            onClick={onManage}
            variant="outline"
            className="rounded-full px-5 py-3 text-sm font-semibold"
          >
            Manage
          </Button>
        </div>
      </div>

      {/* Included tools */}
      <div className="mt-8">
        <div className="text-lg font-semibold text-white">Included tools</div>
        <div className="mt-1 text-sm text-white/60">Choose what you want to open.</div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/vedic-astrology")}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/7 transition"
          >
            <div className="text-white font-semibold">Vedic Astrology</div>
            <div className="mt-1 text-sm text-white/60">
              Your daily influence + deeper blueprint.
            </div>
            <div className="mt-4">
              <Button
                size="sm"
                className="rounded-full px-4 py-2 text-sm font-semibold"
              >
                Open Vedic Astrology
              </Button>
            </div>
          </button>

          <button
            onClick={() => navigate("/ayurveda")}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/7 transition"
          >
            <div className="text-white font-semibold">Ayurveda</div>
            <div className="mt-1 text-sm text-white/60">
              Discover your prakriti and daily balance.
            </div>
            <div className="mt-4">
              <Button
                size="sm"
                className="rounded-full px-4 py-2 text-sm font-semibold"
              >
                Open Ayurveda
              </Button>
            </div>
          </button>
        </div>
      </div>

      {/* Optional journeys (collapsed) */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5">
        <button
          onClick={() => setOpenOptional((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-4"
        >
          <div className="text-left">
            <div className="text-white font-semibold">Optional journeys</div>
            <div className="mt-1 text-sm text-white/60">Open only when you feel ready.</div>
          </div>
          {openOptional ? (
            <ChevronUp className="text-white/70" />
          ) : (
            <ChevronDown className="text-white/70" />
          )}
        </button>

        {openOptional ? (
          <div className="px-4 pb-4">
            <button
              onClick={() => navigate("/transformation")}
              className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/7 transition"
            >
              <div className="text-white font-semibold">6-Month Program</div>
              <div className="mt-1 text-sm text-white/60">
                A deeper transformation path with guidance.
              </div>
              <div className="mt-4">
                <Button
                  size="sm"
                  className="rounded-full px-4 py-2 text-sm font-semibold"
                >
                  View program
                </Button>
              </div>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

