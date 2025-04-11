/*
<ai_context>
This client component provides a theme switcher for the app.
</ai_context>
*/

"use client"

import { cn } from "@/lib/utils"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { HTMLAttributes, ReactNode, useEffect, useState } from "react"

interface ThemeSwitcherProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

export const ThemeSwitcher = ({ children, ...props }: ThemeSwitcherProps) => {
  const [mounted, setMounted] = useState(false)
  const { setTheme, theme } = useTheme()

  // Ensure component is mounted before rendering theme-specific UI
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleChange = (newTheme: "dark" | "light") => {
    // localStorage.setItem("theme", newTheme) // next-themes handles storage
    setTheme(newTheme)
  }

  if (!mounted) {
    // Render a placeholder or null on the server and initial client render
    return <div className="size-6 p-1" />; // Or return null; adjust size as needed
  }

  return (
    <div
      className={cn(
        "p-1 hover:cursor-pointer hover:opacity-50",
        props.className
      )}
      onClick={() => handleChange(theme === "light" ? "dark" : "light")}
    >
      {theme === "dark" ? (
        <Moon className="size-6" />
      ) : (
        <Sun className="size-6" />
      )}
    </div>
  )
}
