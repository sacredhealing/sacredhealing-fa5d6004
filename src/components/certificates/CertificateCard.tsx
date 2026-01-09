import React from 'react';
import { Download, Award, Share2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Certificate {
  id: string;
  title: string;
  description: string | null;
  certificate_type: string;
  issued_at: string;
  pdf_url: string | null;
  is_shared: boolean;
}

interface CertificateCardProps {
  certificate: Certificate;
  onDownload?: (certificateId: string) => void;
  onShare?: (certificateId: string) => void;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  certificate,
  onDownload,
  onShare,
}) => {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'path_completion':
        return 'Path Completion';
      case 'course_completion':
        return 'Course Completion';
      case 'challenge_completion':
        return 'Challenge Completion';
      default:
        return 'Certificate';
    }
  };

  return (
    <Card className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
      <CardContent className="p-0 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <Badge variant="secondary" className="text-xs mb-1">
                {getTypeLabel(certificate.certificate_type)}
              </Badge>
              <h3 className="text-lg font-semibold text-foreground mt-1">
                {certificate.title}
              </h3>
              {certificate.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {certificate.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            Issued {new Date(certificate.issued_at).toLocaleDateString()}
          </span>
          <div className="flex gap-2">
            {onShare && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onShare(certificate.id)}
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            )}
            {onDownload && (
              <Button
                size="sm"
                onClick={() => onDownload(certificate.id)}
                className="bg-primary hover:bg-primary/90"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

