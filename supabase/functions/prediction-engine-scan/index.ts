// supabase/functions/prediction-engine-scan/index.ts
// Polymarket market scanner with Gemini probability estimation
// Returns top edges that meet minimum threshold

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const POLYMARKET_GAMMA = "https://gamma-api.polymarket.com";

interface ScanRequest {
  session_id: string;
  mode: "paper" | "live";
  kelly_fraction: number;
  min_edge_pct: number;
  max_position_pct: number;
  current_balance: number;
}

interface PolymarketEvent {
  id: string;
  question: string;
  outcomes: string;        // JSON array string
  outcomePrices: string;   // JSON array string
  volume24hr?: number;
  liquidity?: number;
  active: boolean;
  closed: boolean;
  endDate?: string;
}

// Kelly side/size calculator (matches client logic)
function kelly(
  p: number,
  marketPrice: number,
  kFrac: number,
  maxPos: number
) {
  const yesEdge = p - marketPrice;
  const noEdge = 1 - p - (1 - marketPrice);
  const side = yesEdge > noEdge ? "YES" : "NO";
  const probWin = side === "YES" ? p : 1 - p;
  const cost = side === "YES" ? marketPrice : 1 - marketPrice;
  const edge = side === "YES" ? yesEdge : noEdge;
  if (cost <= 0 || cost >= 1 || edge <= 0) {
    return { fraction: 0, side, edge };
  }
  const b = 1 / cost - 1;
  const q = 1 - probWin;
  const fullK = (b * probWin - q) / b;
  return {
    fraction: Math.min(Math.max(0, fullK) * kFrac, maxPos),
    side,
    edge,
  };
}

// Ask Gemini to estimate true probability of an event
async function geminiEstimate(question: string, marketPrice: number) {
  const prompt = `You are a calibrated probability estimator for prediction markets.

EVENT: "${question}"
CURRENT MARKET PRICE for YES: ${(marketPrice * 100).toFixed(0)}¢

Estimate the TRUE probability this resolves YES. Consider:
- Base rates for similar events
- Public information available today
- Market efficiency (most prices are roughly correct)

Be conservative. Only deviate significantly from market price if you have strong reasoning. Most of the time your estimate should be within 5% of market.

Respond ONLY with valid JSON, no other text:
{
  "probability": 0.XX,
  "confidence": "low" | "medium" | "high",
  "reasoning": "one sentence why"
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 200,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  try {
    const parsed = JSON.parse(text);
    return {
      probability: Math.min(0.99, Math.max(0.01, Number(parsed.probability))),
      confidence: parsed.confidence || "medium",
      reasoning: parsed.reasoning || "",
    };
  } catch {
    return { probability: marketPrice, confidence: "low", reasoning: "" };
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ScanRequest = await req.json();

    // 1) Fetch active liquid Polymarket markets
    const url = new URL(`${POLYMARKET_GAMMA}/events`);
    url.searchParams.set("active", "true");
    url.searchParams.set("closed", "false");
    url.searchParams.set("order", "volume24hr");
    url.searchParams.set("ascending", "false");
    url.searchParams.set("limit", "20");

    const eventsRes = await fetch(url.toString());
    if (!eventsRes.ok) throw new Error(`Polymarket ${eventsRes.status}`);
    const events: PolymarketEvent[] = await eventsRes.json();

    // 2) Filter to binary, liquid, mid-priced markets (max value zone)
    const filtered = events
      .filter((e) => {
        try {
          const outs = JSON.parse(e.outcomes);
          const prices = JSON.parse(e.outcomePrices);
          if (outs.length !== 2) return false;
          const yes = parseFloat(prices[0]);
          // Skip extreme prices (less edge available, fees dominate)
          return yes > 0.15 && yes < 0.85 && (e.volume24hr ?? 0) > 1000;
        } catch {
          return false;
        }
      })
      .slice(0, 8); // Max 8 Gemini calls per scan to control costs

    // 3) Estimate probabilities & compute edges in parallel
    const candidates = await Promise.all(
      filtered.map(async (e) => {
        try {
          const prices = JSON.parse(e.outcomePrices);
          const marketYes = parseFloat(prices[0]);
          const est = await geminiEstimate(e.question, marketYes);
          const k = kelly(
            est.probability,
            marketYes,
            body.kelly_fraction,
            body.max_position_pct
          );
          if (k.edge < body.min_edge_pct) return null;
          if (est.confidence === "low") return null;

          const sizeUsd = body.current_balance * k.fraction;
          if (sizeUsd < 0.5) return null;

          return {
            id: e.id,
            question: e.question,
            current_price: k.side === "YES" ? marketYes : 1 - marketYes,
            volume_24h: e.volume24hr ?? 0,
            ai_probability: est.probability,
            edge_pct: k.edge,
            recommended_side: k.side,
            recommended_size: Number(sizeUsd.toFixed(2)),
            reasoning: est.reasoning,
          };
        } catch (err) {
          console.error("market eval failed", err);
          return null;
        }
      })
    );

    const filtered_candidates = candidates
      .filter((c) => c !== null)
      .sort((a: any, b: any) => b.edge_pct - a.edge_pct)
      .slice(0, 5); // Top 5 by edge

    return new Response(
      JSON.stringify({
        candidates: filtered_candidates,
        scanned: filtered.length,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e: any) {
    console.error("scan error", e);
    return new Response(
      JSON.stringify({ error: e.message, candidates: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
