import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "VBL Fahrplandaten",
  description: "Dashboard fuer VDV 452 Fahrplandaten",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
