import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const GLASS_BG = 'rgba(255,255,255,0.02)';
const GLASS_BD = 'rgba(255,255,255,0.05)';

function glassShell(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    background: GLASS_BG,
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    border: `1px solid ${GLASS_BD}`,
    borderRadius: 40,
    boxShadow: '0 0 48px rgba(212,175,55,0.07)',
    ...extra,
  };
}

// Fixed, generic signup link — always lands new scanners straight on the
// "Begin Your Journey" (signup) form, regardless of device or browser.
const SIGNUP_URL = 'https://siddhaquantumnexus.com/auth?signup=1';

const AdminSignupQRTab: React.FC = () => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    QRCode.toDataURL(SIGNUP_URL, {
      width: 640,
      margin: 2,
      color: { dark: '#050505', light: '#F5EFD9' },
    }).then(setQrDataUrl).catch(() => {
      toast.error('Could not generate QR code');
    });
  }, []);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'siddha-quantum-nexus-signup-qr.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(SIGNUP_URL);
    setCopied(true);
    toast.success('Link copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div style={glassShell()} className="p-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <QrCode className="h-4 w-4" style={{ color: GOLD }} />
          <span className="text-[10px] font-extrabold tracking-[0.4em] uppercase text-white/50">
            Signup QR Code
          </span>
        </div>
        <h2
          className="mt-2 text-[24px] font-black tracking-[-0.05em]"
          style={{ color: GOLD, textShadow: '0 0 15px rgba(212,175,55,0.3)' }}
        >
          Scan to Begin the Journey
        </h2>
        <p className="mt-2 text-white/60 leading-[1.6] text-sm">
          One QR code, printable anywhere — a class, a market stand, a flyer.
          Scanning it opens the signup form directly. A welcome email is sent
          automatically the moment someone creates their account; nothing
          further needs to be triggered by hand.
        </p>

        <div className="mt-6 flex justify-center">
          {qrDataUrl ? (
            <div className="p-4 rounded-[28px] bg-white/[0.03] border border-white/[0.06]">
              <img
                src={qrDataUrl}
                alt="Signup QR code"
                className="w-56 h-56 rounded-[16px]"
              />
            </div>
          ) : (
            <div className="w-56 h-56 rounded-[28px] bg-white/[0.03] animate-pulse" />
          )}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="rounded-[20px] font-extrabold"
            style={{ background: GOLD, color: '#050505' }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PNG
          </Button>
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="rounded-[20px] font-extrabold border-white/[0.12] text-white/80 hover:text-white"
          >
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Copied' : 'Copy Link'}
          </Button>
        </div>

        <p className="mt-4 text-[11px] text-white/35 break-all">{SIGNUP_URL}</p>
      </div>

      <div style={glassShell()} className="p-6">
        <div className="text-[9px] font-extrabold tracking-[0.4em] uppercase text-white/40 mb-2">
          Good to know
        </div>
        <ul className="text-white/55 text-sm leading-[1.7] list-disc list-inside space-y-1">
          <li>The QR always points to the same link — nothing to regenerate before printing.</li>
          <li>New sign-ups land on the free Atma-Seed tier and can upgrade later from inside the app.</li>
          <li>Welcome emails are sent automatically for every new account, no matter how they signed up.</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminSignupQRTab;
