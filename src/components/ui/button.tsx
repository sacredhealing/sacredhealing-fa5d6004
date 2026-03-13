import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[40px] text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-heading border-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#D4AF37] text-[#050505] font-black hover:bg-[#C4943A] shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:shadow-[0_0_45px_rgba(212,175,55,0.5)] hover:scale-[1.02] active:scale-95 border-none",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_0_15px_hsl(0_84%_60%/0.3)]",
        outline: "bg-white/[0.02] hover:bg-white/[0.04] text-white shadow-[0_0_10px_rgba(212,175,55,0.1)] p-4 border border-white/[0.05] hover:border-[#D4AF37]/20 backdrop-blur-[40px]",
        secondary:
          "bg-secondary text-secondary-foreground font-extrabold hover:bg-secondary/90 shadow-[0_0_15px_hsl(var(--secondary)/0.4)]",
        ghost: "hover:bg-white/[0.04] hover:text-white hover:shadow-[0_0_10px_rgba(212,175,55,0.1)]",
        link: "text-[#D4AF37] underline-offset-4 hover:underline font-bold",
        gold: "bg-[#D4AF37] text-[#050505] font-black shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:shadow-[0_0_50px_rgba(212,175,55,0.5)] hover:scale-[1.02] active:scale-95 rounded-full border-none",
        spiritual:
          "bg-[#D4AF37] text-[#050505] font-black hover:bg-[#C4943A] shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:shadow-[0_0_45px_rgba(212,175,55,0.5)] hover:scale-[1.02] active:scale-95 border-none",
        glass: "bg-white/[0.02] hover:bg-white/[0.04] text-white shadow-[0_0_10px_rgba(212,175,55,0.1)] hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] p-4 border border-white/[0.05] hover:border-[#D4AF37]/15 backdrop-blur-[40px]",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-[20px] px-4",
        lg: "h-12 rounded-[40px] px-8 text-base",
        xl: "h-14 rounded-[40px] px-10 text-lg",
        icon: "h-10 w-10 rounded-[20px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
