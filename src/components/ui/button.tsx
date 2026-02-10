import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap pixel-rounded pixel-font text-xs tracking-wider ring-offset-white pixel-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:pixel-click hover:pixel-hover pixel-border pixel-shadow",
  {
    variants: {
      variant: {
        default: 
          "bg-rose-600 text-white border-rose-800 hover:bg-rose-700 hover:border-rose-900",
        destructive: 
          "bg-red-500 text-white border-red-700 hover:bg-red-600 hover:border-red-800",
        outline: 
          "border-2 border-rose-500 bg-white text-rose-700 hover:bg-rose-100 hover:border-rose-600",
        secondary: 
          "bg-rose-200 text-rose-900 border-rose-400 hover:bg-rose-300 hover:border-rose-500",
        ghost: 
          "text-slate-600 border-transparent hover:bg-rose-100 hover:border-rose-300 hover:text-rose-700",
        link: 
          "text-rose-600 border-transparent underline-offset-4 hover:underline hover:text-rose-700",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2 text-[10px]",
        lg: "h-14 px-8 py-4 text-sm",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
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
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };