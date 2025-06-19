import { ReactNode } from "react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Find Meeting Points Between Locations",
  description: "Discover perfect meeting spots halfway between two or more addresses. Find restaurants, cafés, parks, and hotels with travel times and distances.",
  openGraph: {
    title: "Find Perfect Meeting Points - Meet Me Halfway",
    description: "Smart location finder that calculates exact midpoints between addresses and shows nearby points of interest.",
    url: "/meet-me-halfway",
  },
  twitter: {
    title: "Find Perfect Meeting Points - Meet Me Halfway", 
    description: "Smart location finder with POI discovery and travel time calculations.",
  },
}

function BackgroundWrapper({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>
}

export default function MeetMeHalfwayLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <BackgroundWrapper>
      {children}
    </BackgroundWrapper>
  )
}
