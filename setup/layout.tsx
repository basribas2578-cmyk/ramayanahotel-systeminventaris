import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Setup - Hotel Inventory System",
  description: "Automatic setup wizard for Hotel Inventory System",
}

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
