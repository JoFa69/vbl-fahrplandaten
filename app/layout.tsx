import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Sidebar } from "@/components/sidebar"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" })

export const metadata: Metadata = {
  title: "VBL Fahrplandaten",
  description: "Dashboard fuer VDV 452 Fahrplandaten der Verkehrsbetriebe Luzern",
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
    <html lang="de" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} ${jetbrainsMono.variable} antialiased`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-60 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
