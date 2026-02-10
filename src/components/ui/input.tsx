import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Layout & Base
          "flex h-12 w-full pixel-rounded pixel-border border-4 border-rose-300 bg-white px-4 py-3 text-sm ring-offset-white pixel-shadow",
          // Typography
          "text-slate-700 placeholder:text-slate-400 pixel-font-secondary",
          // File Input Styling
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-rose-600",
          // Focus States (Chunky border)
          "focus-visible:outline-none focus-visible:border-4 focus-visible:border-rose-500 focus-visible:ring-0",
          // Transitions
          "pixel-transition",
          // Disabled State
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-rose-100 disabled:border-rose-200",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };