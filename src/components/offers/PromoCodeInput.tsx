import { useState } from "react";
import { Tag, Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PromoCodeInputProps {
  tierSlug?: string;
  onPromoApplied?: (offer: {
    id: string;
    name: string;
    code: string;
    discount_type: string;
    discount_value: number;
  }) => void;
  onPromoRemoved?: () => void;
  className?: string;
}

export const PromoCodeInput = ({ 
  tierSlug, 
  onPromoApplied, 
  onPromoRemoved,
  className 
}: PromoCodeInputProps) => {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [appliedOffer, setAppliedOffer] = useState<{
    id: string;
    name: string;
    code: string;
    discount_type: string;
    discount_value: number;
  } | null>(null);

  const handleApplyCode = async () => {
    if (!code.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    setIsValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke("apply-promo-code", {
        body: { code: code.trim(), tier_slug: tierSlug }
      });

      if (error) throw error;

      if (data.valid) {
        setAppliedOffer(data.offer);
        onPromoApplied?.(data.offer);
        toast.success(`Promo code applied: ${data.offer.name}`, {
          description: data.offer.discount_type === "percent" 
            ? `${data.offer.discount_value}% off`
            : `€${data.offer.discount_value} off`
        });
      } else {
        toast.error(data.error || "Invalid promo code");
      }
    } catch (error: any) {
      console.error("Error applying promo code:", error);
      toast.error(error.message || "Failed to apply promo code");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCode = () => {
    setAppliedOffer(null);
    setCode("");
    onPromoRemoved?.();
  };

  if (appliedOffer) {
    return (
      <div className={cn("flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30", className)}>
        <Check className="w-5 h-5 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {appliedOffer.code}
          </p>
          <p className="text-xs text-muted-foreground">
            {appliedOffer.discount_type === "percent" 
              ? `${appliedOffer.discount_value}% off`
              : `€${appliedOffer.discount_value} off`
            }
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleRemoveCode}
          className="h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2", className)}>
      <div className="relative flex-1">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter promo code"
          className="pl-10"
          onKeyDown={(e) => e.key === "Enter" && handleApplyCode()}
        />
      </div>
      <Button 
        variant="outline" 
        onClick={handleApplyCode}
        disabled={isValidating || !code.trim()}
      >
        {isValidating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "Apply"
        )}
      </Button>
    </div>
  );
};
