import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Nav } from "@/components/client/navigation/nav"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "v0 MCP Server - Generate React Components with AI",
  description: "Generate React components with AI directly in Claude Desktop using the v0 MCP Server",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Nav />
        {children}
      </body>
    </html>
  )
}