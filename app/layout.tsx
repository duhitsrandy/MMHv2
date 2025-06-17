/*
<ai_context>
The root server layout for the app.
</ai_context>
*/

import { type Metadata, type Viewport } from "next"
import { Inter } from "next/font/google"

import { AuthProvider } from "@/components/auth/auth-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { CSPostHogProvider } from "@/components/utilities/posthog/posthog-provider"
import { PostHogPageview } from "@/components/utilities/posthog/posthog-pageview"
import { PostHogUserIdentify } from "@/components/utilities/posthog/posthog-user-identity"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Meet Me Halfway",
  description: "Find the perfect meeting point between two locations",
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  // Optimize for mobile devices
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <CSPostHogProvider>
          <ThemeProvider>
            <AuthProvider>
              {children}
              <PostHogPageview />
              <PostHogUserIdentify />
            </AuthProvider>
          </ThemeProvider>
        </CSPostHogProvider>
      </body>
    </html>
  )
}
