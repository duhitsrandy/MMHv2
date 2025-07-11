/*
<ai_context>
This client page provides the signup form from Clerk.
</ai_context>
*/

"use client"

import { SignUp } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useTheme } from "next-themes"

export default function SignUpPage() {
  const { theme } = useTheme()

  return (
    <SignUp
      path="/signup"
      routing="path"
      signInUrl="/login"
      forceRedirectUrl="/meet-me-halfway"
      appearance={{ baseTheme: theme === "dark" ? dark : undefined }}
    />
  )
}
