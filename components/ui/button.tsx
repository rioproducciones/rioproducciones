import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-rio-cyan text-black hover:bg-cyan-200 border-transparent shadow-glow",
  secondary:
    "bg-white/10 text-white hover:bg-white/[0.15] border-white/10",
  ghost:
    "bg-transparent text-white hover:bg-white/10 border-transparent",
  danger:
    "bg-rio-red text-white hover:bg-red-400 border-transparent",
  success:
    "bg-rio-green text-black hover:bg-green-300 border-transparent"
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
