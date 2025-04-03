import { ReactNode } from "react"
import Header from "@/components/header"

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
      <Header />
      {children}
    </BackgroundWrapper>
  )
}
