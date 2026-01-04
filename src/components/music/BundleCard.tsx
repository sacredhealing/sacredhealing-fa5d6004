import React from 'react';
import { Music2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Bundle {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  price_usd: number;
  discount_percent: number;
  trackCount?: number;
}

interface BundleCardProps {
  bundle: Bundle;
  isOwned?: boolean;
  onPurchase?: (bundle: Bundle) => void;
}

export const BundleCard: React.FC<BundleCardProps> = ({
  bundle,
  isOwned = false,
  onPurchase,
}) => {
  const originalPrice = bundle.discount_percent > 0 
    ? bundle.price_usd / (1 - bundle.discount_percent / 100) 
    : bundle.price_usd;

  return (
    <Card className="bg-gradient-to-br from-muted/40 to-muted/20 border-border/50 overflow-hidden">
      {/* Cover Image */}
      <div className="aspect-video relative">
        {bundle.cover_image_url ? (
          <img 
            src={bundle.cover_image_url} 
            alt={bundle.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Music2 size={40} className="text-muted-foreground" />
          </div>
        )}
        
        {/* Discount Badge */}
        {bundle.discount_percent > 0 && !isOwned && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
            {bundle.discount_percent}% OFF
          </div>
        )}

        {/* Owned Badge */}
        {isOwned && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
            <Check size={12} />
            Owned
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold mb-1 line-clamp-1">{bundle.title}</h3>
        
        {bundle.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {bundle.description}
          </p>
        )}

        {bundle.trackCount !== undefined && (
          <p className="text-xs text-muted-foreground mb-3">
            {bundle.trackCount} tracks included
          </p>
        )}

        {/* Price & Action */}
        <div className="flex items-center justify-between">
          {isOwned ? (
            <span className="text-sm text-green-500 font-medium">Full access</span>
          ) : (
            <div className="flex items-center gap-2">
              {bundle.discount_percent > 0 && (
                <span className="text-sm text-muted-foreground line-through">
                  €{originalPrice.toFixed(2)}
                </span>
              )}
              <span className="text-lg font-bold text-primary">
                €{bundle.price_usd.toFixed(2)}
              </span>
            </div>
          )}

          {!isOwned && (
            <Button 
              size="sm" 
              onClick={() => onPurchase?.(bundle)}
            >
              Buy Bundle
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
