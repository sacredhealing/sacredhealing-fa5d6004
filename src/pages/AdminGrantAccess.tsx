import { useNavigate } from "react-router-dom";
import { ArrowLeft, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAuth } from "@/hooks/useAuth";
import AdminAccessGrantTab from "@/components/admin-system/AdminAccessGrantTab";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const GOLD = "#D4AF37";
const BG = "#050505";

export default function AdminGrantAccess() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: isAdminLoading } = useAdminRole();
  const { isLoading: isAuthLoading } = useAuth();

  if (isAuthLoading || isAdminLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: BG, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800;900&display=swap');`}</style>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.45em", textTransform: "uppercase", color: "rgba(212,175,55,0.5)" }}>
          Calibrating grant console…
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ background: BG, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800;900&display=swap');`}</style>
        <Card
          className="w-full max-w-md border-white/10 text-white"
          style={{
            background: "rgba(255,255,255,0.02)",
            backdropFilter: "blur(40px)",
            borderRadius: 40,
            boxShadow: "0 0 48px rgba(212,175,55,0.08)",
          }}
        >
          <CardHeader>
            <CardTitle style={{ color: GOLD }}>Access denied</CardTitle>
            <CardDescription className="text-white/50">You need admin privileges to grant access.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate("/dashboard")}
              className="w-full rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: BG,
        fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
        color: "#fff",
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800;900&display=swap');`}</style>
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -left-20 top-0 h-[420px] w-[420px] rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, rgba(212,175,55,0.12), transparent 70%)", filter: "blur(60px)" }}
        />
        <div
          className="absolute bottom-0 right-0 h-[380px] w-[380px] rounded-full opacity-35"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.08), transparent 70%)", filter: "blur(55px)" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex flex-wrap items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin")}
            className="shrink-0 rounded-full border border-white/10 text-white/60 hover:bg-white/5 hover:text-[#D4AF37]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <p
              style={{
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: "0.5em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                marginBottom: 8,
              }}
            >
              Admin · SQI 2050
            </p>
            <h1
              className="flex flex-wrap items-center gap-3"
              style={{ fontSize: "clamp(1.5rem,4vw,2rem)", fontWeight: 900, letterSpacing: "-0.04em", color: GOLD, textShadow: "0 0 22px rgba(212,175,55,0.2)" }}
            >
              <Gift className="h-7 w-7" style={{ color: GOLD }} />
              Grant access
            </h1>
            <p className="mt-3 max-w-xl text-[13px] font-normal leading-relaxed text-white/55">
              Assign Prana-Flow, Siddha-Quantum, or Akasha-Infinity tiers, plus courses, paths, Sri Yantra, Creative Soul, Siddha Oracle, and other program keys—without payment. Membership resolves through the same edge function as Stripe.
            </p>
          </div>
        </div>

        <AdminAccessGrantTab />
      </div>
    </div>
  );
}
