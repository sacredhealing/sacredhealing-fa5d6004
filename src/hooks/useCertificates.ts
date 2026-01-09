import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Certificate {
  id: string;
  title: string;
  description: string | null;
  certificate_type: string;
  related_id: string | null;
  issued_at: string;
  pdf_url: string | null;
  is_shared: boolean;
}

export const useCertificates = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCertificates = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false });

      if (error) throw error;
      setCertificates(data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load certificates',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const downloadCertificate = useCallback(async (certificateId: string) => {
    const certificate = certificates.find(c => c.id === certificateId);
    if (!certificate) return;

    if (certificate.pdf_url) {
      // If PDF exists, download it
      window.open(certificate.pdf_url, '_blank');
    } else {
      // TODO: Generate PDF on the fly or show message
      toast({
        title: 'Certificate',
        description: 'PDF generation coming soon. Certificate will be available shortly.',
      });
    }
  }, [certificates, toast]);

  const shareCertificate = useCallback(async (certificateId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('certificates')
        .update({
          is_shared: true,
          shared_at: new Date().toISOString(),
        })
        .eq('id', certificateId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Certificate shared!',
      });

      fetchCertificates();
    } catch (error) {
      console.error('Error sharing certificate:', error);
      toast({
        title: 'Error',
        description: 'Failed to share certificate',
        variant: 'destructive',
      });
    }
  }, [toast, fetchCertificates]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  return {
    certificates,
    isLoading,
    downloadCertificate,
    shareCertificate,
    refetch: fetchCertificates,
  };
};

