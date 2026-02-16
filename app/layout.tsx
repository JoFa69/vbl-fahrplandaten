import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" })

export const metadata: Metadata = {
  title: "Transit Planner OS",
  description: "Public Transit Network Planning Dashboard",
}

export const viewport: Viewport = {
  themeColor: "#f8fafc",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${inter.className} ${jetbrainsMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
