"use client";

import * as React from "react";
import { CheckIcon } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked);
      }
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border-2 border-gray-300 bg-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C29A3] focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "checked:bg-[#5C29A3] checked:border-[#5C29A3]",
            "transition-colors",
            className
          )}
          {...props}
        />
        {checked && (
          <CheckIcon className="absolute left-0.5 top-0.5 h-3 w-3 text-white pointer-events-none" />
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
