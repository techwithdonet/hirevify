"use client";

import type { CSSProperties } from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
 const { theme = "system" } = useTheme();

 return (
 <Sonner
 theme={theme as ToasterProps["theme"]}
 className="toaster group"
 position="top-right"
 richColors
 visibleToasts={4}
 toastOptions={{
 ...toastOptions,
 classNames: {
 toast: "group-[.toaster]:rounded-xl group-[.toaster]:border group-[.toaster]:px-4 group-[.toaster]:py-3 group-[.toaster]:shadow-lg group-[.toaster]:shadow-emerald-950/10",
 success: "group-[.toaster]:border-emerald-200 group-[.toaster]:bg-emerald-50 group-[.toaster]:text-emerald-900",
 error: "group-[.toaster]:border-red-200 group-[.toaster]:bg-red-50 group-[.toaster]:text-red-900",
 warning: "group-[.toaster]:border-amber-200 group-[.toaster]:bg-amber-50 group-[.toaster]:text-amber-900",
 info: "group-[.toaster]:border-blue-200 group-[.toaster]:bg-blue-50 group-[.toaster]:text-blue-900",
 ...toastOptions?.classNames,
 },
 }}
 style={
 {
 "--normal-bg": "var(--popover)",
 "--normal-text": "var(--popover-foreground)",
 "--normal-border": "var(--border)",
 } as CSSProperties
 }
 {...props}
 />
 );
};

export { Toaster };
