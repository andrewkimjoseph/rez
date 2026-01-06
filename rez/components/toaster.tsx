"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      expand={true}
      richColors={false}
      closeButton={true}
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-900 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-sm",
          description: "group-[.toast]:text-slate-600 group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:bg-primary/90 group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-700 group-[.toast]:hover:bg-slate-200 group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium",
          success:
            "group-[.toast]:bg-gradient-to-br group-[.toast]:from-emerald-50 group-[.toast]:to-emerald-100/50 group-[.toast]:text-emerald-900 group-[.toast]:border-emerald-200 group-[.toast]:border-l-4 group-[.toast]:border-l-emerald-500",
          error:
            "group-[.toast]:bg-gradient-to-br group-[.toast]:from-red-50 group-[.toast]:to-red-100/50 group-[.toast]:text-red-900 group-[.toast]:border-red-200 group-[.toast]:border-l-4 group-[.toast]:border-l-red-500",
          warning:
            "group-[.toast]:bg-gradient-to-br group-[.toast]:from-amber-50 group-[.toast]:to-amber-100/50 group-[.toast]:text-amber-900 group-[.toast]:border-amber-200 group-[.toast]:border-l-4 group-[.toast]:border-l-amber-500",
          info: "group-[.toast]:bg-gradient-to-br group-[.toast]:from-blue-50 group-[.toast]:to-blue-100/50 group-[.toast]:text-blue-900 group-[.toast]:border-blue-200 group-[.toast]:border-l-4 group-[.toast]:border-l-blue-500",
          default:
            "group-[.toast]:bg-white group-[.toast]:text-slate-900 group-[.toast]:border-slate-200 group-[.toast]:border-l-4 group-[.toast]:border-l-slate-400",
        },
        style: {
          borderRadius: "0.75rem",
          borderWidth: "1px",
          boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
          padding: "1rem",
          minWidth: "320px",
          maxWidth: "420px",
        },
      }}
    />
  );
}

