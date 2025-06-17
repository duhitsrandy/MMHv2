import { ReactNode } from "react"

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
