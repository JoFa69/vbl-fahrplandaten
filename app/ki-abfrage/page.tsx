"use client"

import { useState } from "react"
import { Send, Bot, User, Code } from "lucide-react"
import { cn } from "@/lib/utils"
import { aiChatHistory } from "@/lib/mock-data"

interface ChatMessage {
  role: "user" | "assistant"
  message: string
  sql?: string
}

export default function KiAbfragePage() {
  const [messages, setMessages] = useState<ChatMessage[]>(aiChatHistory)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = { role: "user", message: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulierte Antwort
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        role: "assistant",
        message:
          "Das ist eine simulierte Antwort. Verbinde das Backend unter localhost:8081 fuer echte KI-Abfragen.",
        sql: "SELECT * FROM rec_frt LIMIT 10;",
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1200)
  }

  return (
    <div className="flex h-screen flex-col p-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-foreground">KI-Abfrage</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Stelle Fragen zu deinen Fahrplandaten in natuerlicher Sprache
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div
              className={cn(
                "max-w-2xl rounded-lg px-4 py-3",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "border bg-card"
              )}
            >
              <p className="text-sm leading-relaxed">{msg.message}</p>
              {msg.sql && (
                <div className="mt-3 rounded-md bg-background p-3 border">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Code className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      SQL
                    </span>
                  </div>
                  <code className="text-xs font-mono text-accent block">
                    {msg.sql}
                  </code>
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                <User className="h-4 w-4 text-secondary-foreground" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="rounded-lg border bg-card px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground [animation-delay:0.2s]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 rounded-lg border bg-card p-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Frage zu Fahrplandaten stellen..."
          className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Senden</span>
        </button>
      </form>
    </div>
  )
}
