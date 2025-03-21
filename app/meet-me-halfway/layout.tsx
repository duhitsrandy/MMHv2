import { ReactNode } from "react"

function BackgroundWrapper({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-gray-50">{children}</div>
}

export default function MeetMeHalfwayLayout({
  children
}: {
  children: ReactNode
}) {
  return <BackgroundWrapper>{children}</BackgroundWrapper>
}
