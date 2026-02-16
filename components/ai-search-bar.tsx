"use client"

import { Sparkles, ArrowRight } from "lucide-react"

export function AiSearchBar() {
  return (
    <div className="relative">
      <div className="flex items-center bg-card border border-border rounded-xl px-4 py-3 shadow-sm hover:shadow-md hover:border-muted-foreground/25 transition-all group">
        <Sparkles className="w-4 h-4 text-chart-sky shrink-0 mr-3" />
        <input
          type="text"
          placeholder="Frage die Fahrplandaten... z.B. 'Welche Linie hat die meisten Fahrten am Samstag?'"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button className="flex items-center gap-1.5 ml-3 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors shrink-0">
          Fragen
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <div className="flex items-center gap-3 mt-2 px-1">
        <span className="text-[10px] text-muted-foreground">Vorschlaege:</span>
        {["Wendezeiten unter 3 Min.", "Linie 3 Auslastung", "Import-Fehler heute"].map(q => (
          <button key={q} className="text-[10px] text-primary/70 hover:text-primary bg-primary/5 hover:bg-primary/10 px-2 py-0.5 rounded-full transition-colors">
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
