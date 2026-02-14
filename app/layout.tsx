import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Sidebar } from "@/components/sidebar"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "VBL Fahrplandaten - Dashboard",
  description: "Analyse-Dashboard fuer VDV 452 Fahrplandaten der Verkehrsbetriebe Luzern",
}

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className="dark">
      <body
        className={`${inter.className} ${jetbrainsMono.className} antialiased`}
      >
        <Sidebar />
        <main className="ml-60 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
