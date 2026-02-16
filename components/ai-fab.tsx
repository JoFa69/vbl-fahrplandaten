"use client"

import { Sparkles } from "lucide-react"

export function AiFab() {
  return (
    <button
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all group"
      aria-label="Transit AI Assistant"
    >
      <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
      <span className="text-sm font-medium">Transit AI</span>
    </button>
  )
}
