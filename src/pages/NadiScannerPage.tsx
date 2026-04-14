import NadiScanner from '@/components/NadiScanner';
import { useAuth } from '@/hooks/useAuth';
import { useJyotishProfile } from '@/hooks/useJyotishProfile';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NadiScannerPage() {
  const { user } = useAuth();
  const jyotish = useJyotishProfile();
  const navigate = useNavigate();

  const userName =
    (user as any)?.user_metadata?.full_name?.split(' ')?.[0] ||
    user?.email?.split('@')?.[0] ||
    'Seeker';

  return (
    <div
      className="relative min-h-screen text-white"
      style={{ background: '#050505', fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}
    >
      {/* Deep space background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 20% 20%, rgba(212,175,55,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(212,175,55,0.03) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition"
          >
            <ArrowLeft size={16} className="text-white/60" />
          </button>
          <div>
            <h1
              className="text-xl font-black tracking-[-0.04em] text-white"
              style={{ textShadow: '0 0 30px rgba(212,175,55,0.2)' }}
            >
              Nadi Scanner
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#D4AF37]/40 mt-0.5">
              SQI · Biometric Field Analysis
            </p>
          </div>
        </div>

        {/* Scanner */}
        <NadiScanner
          userName={userName}
          jyotishContext={{
            mahadasha: jyotish?.mahadasha,
            nakshatra: jyotish?.nakshatra,
            primaryDosha: jyotish?.primaryDosha,
          }}
          onScanComplete={(reading) => {
            // Could log to Supabase here in the future
            console.info('[NadiScanner] Scan complete', reading);
          }}
        />
      </div>
    </div>
  );
}
