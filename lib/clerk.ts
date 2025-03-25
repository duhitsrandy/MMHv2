import { authMiddleware } from "@clerk/nextjs/server"

export const clerkConfig = {
  debug: process.env.NODE_ENV === "development",
  isSsr: true,
  appearance: {
    elements: {
      formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
      footerActionLink: "text-primary hover:text-primary/90",
    },
  },
}

export const authConfig = authMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up"],
  ignoredRoutes: ["/api/webhook"],
}) 