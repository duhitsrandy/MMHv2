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
  title: {
    default: "Meet Me Halfway - Find Perfect Meeting Points Between Locations",
    template: "%s | Meet Me Halfway"
  },
  description: "Find cafés, parks, restaurants, or hotels exactly between two or more addresses. Smart midpoint finder with real-time traffic and points of interest.",
  keywords: [
    "midpoint finder",
    "meet halfway",
    "meeting point",
    "location finder",
    "travel planning",
    "halfway point calculator",
    "route planner",
    "points of interest"
  ],
  authors: [{ name: "Meet Me Halfway" }],
  creator: "Meet Me Halfway",
  publisher: "Meet Me Halfway",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://meetmehalfway.co'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Meet Me Halfway',
    title: 'Meet Me Halfway - Smart Midpoint Finder',
    description: 'Find perfect meeting spots between any locations. Discover cafés, parks, restaurants, and hotels exactly halfway between two or more addresses.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Meet Me Halfway - Find perfect meeting points between locations',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@meetmehalfway',
    creator: '@meetmehalfway',
    title: 'Meet Me Halfway - Smart Midpoint Finder',
    description: 'Find perfect meeting spots between any locations with smart POI discovery.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f0f' }
  ],
  viewportFit: 'cover',
}

// Structured Data JSON-LD
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Meet Me Halfway',
  description: 'Smart midpoint finder application that helps you discover perfect meeting points between multiple locations with points of interest.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://meetmehalfway.co',
  applicationCategory: 'TravelApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free tier available with premium features'
  },
  author: {
    '@type': 'Organization',
    name: 'Meet Me Halfway'
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '150'
  },
  features: [
    'Multi-location midpoint calculation',
    'Points of interest discovery',
    'Real-time traffic integration',
    'Saved locations and searches',
    'Mobile-optimized interface'
  ]
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
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
