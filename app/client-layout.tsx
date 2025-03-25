"use client"

import { ClerkProvider } from "@clerk/nextjs"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClerkProvider>{children}</ClerkProvider>
} 