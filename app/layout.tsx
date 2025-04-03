/*
<ai_context>
The root server layout for the app.
</ai_context>
*/

import { type Metadata } from "next"
import { Inter } from "next/font/google"

import { AuthProvider } from "@/components/auth/auth-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Meet Me Halfway",
  description: "Find the perfect meeting point between two locations",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
