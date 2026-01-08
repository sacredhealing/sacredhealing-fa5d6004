import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

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
  return (
    <Card className="bg-card/50 border-border/50 overflow-hidden">
      <CardContent className="p-0">
        <img
          src={src}
          alt={alt}
          className={`w-full h-auto ${className}`}
          style={{ maxWidth, display: 'block' }}
          loading="lazy"
        />
      </CardContent>
    </Card>
  );
};

export default GifDisplay;

