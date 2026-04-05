import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070F3]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#0070F3] text-white hover:bg-[#005FD4] shadow-lg shadow-[#0070F3]/20 hover:shadow-[#0070F3]/35 hover:scale-[1.02] active:scale-[0.98]",
        destructive: "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30",
        outline: "border border-white/15 text-white/80 hover:bg-white/8 hover:text-white hover:border-[#0070F3]/40",
        secondary: "bg-white/8 text-white/80 border border-white/8 hover:bg-white/12",
        ghost: "text-white/60 hover:text-white hover:bg-white/8",
        link: "text-[#0070F3] underline-offset-4 hover:underline",
        gradient: "bg-[#0070F3] text-white hover:bg-[#005FD4] shadow-lg shadow-[#0070F3]/20 hover:shadow-[#0070F3]/35 hover:scale-[1.02] active:scale-[0.98]",
        glass: "bg-white/8 border border-white/10 text-white hover:bg-white/12 hover:border-[#0070F3]/20",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
