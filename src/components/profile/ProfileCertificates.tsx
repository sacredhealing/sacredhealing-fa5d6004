// @ts-nocheck
import React from 'react';
import { CertificateCard } from '@/components/certificates/CertificateCard';

export interface CertificateItem {
  id: string;
  title: string;
  description: string | null;
  certificate_type: string;
  issued_at: string;
  pdf_url: string | null;
  is_shared: boolean;
}

export interface ProfileCertificatesProps {
  certificates: CertificateItem[];
  onDownload: (certificateId: string) => void;
  onShare: (certificateId: string) => void;
}

export const ProfileCertificates: React.FC<ProfileCertificatesProps> = ({
  certificates,
  onDownload,
  onShare,
}) => {
  if (certificates.length === 0) return null;
  return (
    <div className="profile-card rounded-[28px] border border-[#D4AF37]/12 bg-white/[0.02] backdrop-blur-[40px] p-8 mb-8">
      <p className="uppercase mb-4" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '8px', letterSpacing: '0.5em', color: 'rgba(212,175,55,0.6)' }}>◈ SOVEREIGN SEALS</p>
      <div className="space-y-3">
        {certificates.map((certificate) => (
          <CertificateCard
            key={certificate.id}
            certificate={certificate}
            onDownload={onDownload}
            onShare={onShare}
          />
        ))}
      </div>
    </div>
  );
};
