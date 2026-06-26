"use client"

import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 rounded-xl border p-4 shadow-xl animate-fade-in",
            t.variant === "destructive"
              ? "bg-red-950/90 border-red-800 text-red-200"
              : t.variant === "success"
              ? "bg-emerald-950/90 border-emerald-800 text-emerald-200"
              : "bg-[#1e1e2a]/95 border-[#2a2a3a] text-white"
          )}
        >
          {t.variant === "destructive" ? (
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-400" />
          ) : t.variant === "success" ? (
            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-emerald-400" />
          ) : (
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-indigo-400" />
          )}
          <div className="flex-1 min-w-0">
            {t.title && <p className="text-sm font-semibold">{t.title}</p>}
            {t.description && <p className="text-xs opacity-80 mt-0.5">{t.description}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
