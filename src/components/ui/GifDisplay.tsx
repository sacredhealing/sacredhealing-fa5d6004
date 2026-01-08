import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ImageOff } from 'lucide-react';

interface GifDisplayProps {
  src: string;
  alt: string;
  className?: string;
  maxWidth?: string;
}

const GifDisplay: React.FC<GifDisplayProps> = ({ 
  src, 
  alt, 
  className = '',
  maxWidth = '100%'
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if src is a placeholder or invalid
  const isValidUrl = src && !src.includes('your-gif-id') && !src.includes('maha-lakshmi.gif');

  if (!isValidUrl) {
    return (
      <Card className="bg-card/50 border-border/50 overflow-hidden">
        <CardContent className="p-6 text-center">
          <ImageOff className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Please update the Maha Lakshmi GIF URL in the code
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50 overflow-hidden">
      <CardContent className="p-0 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        )}
        {hasError ? (
          <div className="p-6 text-center">
            <ImageOff className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Failed to load image</p>
          </div>
        ) : (
          <img
            src={src}
            alt={alt}
            className={`w-full h-auto ${className}`}
            style={{ maxWidth, display: 'block' }}
            loading="lazy"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default GifDisplay;

