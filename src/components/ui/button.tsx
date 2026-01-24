import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[24px] text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-heading border-0",
  {
    variants: {
      variant: {
        // Primary - Glowing Turquoise #00F2FE with strong glow
        default:
          "bg-[#00F2FE] text-[#0B0A1A] font-semibold hover:bg-[#00D4E0] shadow-[0_0_15px_rgba(0,242,254,0.6)] hover:shadow-[0_0_25px_rgba(0,242,254,0.7)]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_0_15px_hsl(0_84%_60%/0.3)]",
        outline: "glass-card hover:bg-white/5 text-white shadow-[0_0_10px_rgba(0,242,254,0.1)]",
        secondary:
          "bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/90 shadow-[0_0_15px_hsl(var(--secondary)/0.4)]",
        ghost: "hover:bg-white/5 hover:text-white hover:shadow-[0_0_10px_rgba(0,242,254,0.15)]",
        link: "text-[#00F2FE] underline-offset-4 hover:underline",
        gold: "bg-gradient-to-r from-[hsl(51,100%,50%)] to-[hsl(45,100%,45%)] text-gray-900 font-semibold shadow-[0_0_20px_hsl(51_100%_50%/0.5)] hover:shadow-[0_0_30px_hsl(51_100%_50%/0.6)] hover:scale-105 rounded-full",
        spiritual:
          "bg-[#00F2FE] text-[#0B0A1A] font-semibold hover:bg-[#00D4E0] shadow-[0_0_15px_rgba(0,242,254,0.6)] hover:shadow-[0_0_25px_rgba(0,242,254,0.7)] hover:scale-105",
        glass: "glass-card hover:bg-white/5 text-white shadow-[0_0_15px_rgba(0,242,254,0.15)] hover:shadow-[0_0_20px_rgba(0,242,254,0.25)]",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-[16px] px-4",
        lg: "h-12 rounded-[24px] px-8 text-base",
        xl: "h-14 rounded-[24px] px-10 text-lg",
        icon: "h-10 w-10 rounded-[16px]",
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
