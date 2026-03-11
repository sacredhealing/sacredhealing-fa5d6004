import { ArrowLeft, Zap, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";

const SiddhaSoundAlchemyOracle = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();

  const handleBack = () => {
    navigate("/creative-soul/store");
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col">
        <div className="max-w-4xl mx-auto px-6 py-10 w-full">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/60 hover:text-[#D4AF37] mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Creative Soul Store
          </button>
          <div className="rounded-3xl border border-red-500/30 bg-red-500/5 px-6 py-8">
            <p className="text-sm font-semibold tracking-[0.18em] uppercase text-red-300 mb-2">
              Admin Only Field
            </p>
            <p className="text-sm text-white/70">
              The Siddha Sound Alchemy Oracle is a protected creation space and can only be opened
              from an Administrator account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const oracleUrl = import.meta.env.VITE_SIDDHA_ORACLE_URL as string | undefined;

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-[#3a1510] blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[26rem] h-[26rem] rounded-full bg-[#D4AF37] blur-[160px] opacity-40" />
      </div>

      <div className="relative flex flex-col h-screen max-h-screen">
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/60 hover:text-[#D4AF37]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="ml-auto inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-black/60 px-3 py-1 text-[10px] font-bold tracking-[0.26em] uppercase text-[#D4AF37]">
            <Zap className="w-3 h-3" />
            Siddha Sound Alchemy Oracle
          </div>
        </div>

        {!oracleUrl ? (
          <div className="flex-1 flex items-center justify-center px-6 pb-8">
            <div className="max-w-md w-full rounded-3xl border border-yellow-500/40 bg-yellow-500/5 px-6 py-6">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <p className="text-xs font-semibold tracking-[0.22em] uppercase text-yellow-300">
                  Siddha Oracle not configured
                </p>
              </div>
              <p className="text-sm text-white/80">
                Set <code className="text-[11px]">VITE_SIDDHA_ORACLE_URL</code> in your environment
                to point at the deployed Siddha Sound Alchemy Oracle app. Once set, this admin page
                will embed the full tool here.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 px-4 pb-4">
            <div className="w-full h-full rounded-3xl border border-white/10 overflow-hidden bg-black/70 backdrop-blur-2xl">
              <iframe
                src={oracleUrl}
                title="Siddha Sound Alchemy Oracle"
                className="w-full h-full border-0"
                allow="microphone; camera; autoplay; clipboard-read; clipboard-write; encrypted-media"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SiddhaSoundAlchemyOracle;

