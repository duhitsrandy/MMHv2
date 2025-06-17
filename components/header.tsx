/*
<ai_context>
This client component provides the header for the app.
</ai_context>
*/

"use client"

import { Button } from "@/components/ui/button"
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton
} from "@clerk/nextjs"
import { Menu, Route, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ThemeSwitcher } from "./utilities/theme-switcher"
import { PlanBadge } from "./ui/plan-badge"

const signedInLinks = [
  { href: "/meet-me-halfway/saved-searches", label: "Search History" }
]

const alwaysVisibleLinks = [
  { href: "/pricing", label: "Pricing" }
]

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-colors ${
        isScrolled
          ? "bg-background/80 shadow-sm backdrop-blur-sm"
          : "bg-background"
      }`}
    >
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between p-3 sm:p-4">
        <Link href="/meet-me-halfway" className="flex items-center space-x-2 hover:cursor-pointer hover:opacity-80 min-w-0">
          <Route className="size-5 sm:size-6 shrink-0" />
          <span className="text-lg sm:text-xl font-bold truncate">
            Meet Me Halfway
          </span>
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 space-x-2 font-semibold md:flex">
          <SignedIn>
            {signedInLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-1 text-sm hover:opacity-80 whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </SignedIn>
          {alwaysVisibleLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1 text-sm hover:opacity-80 whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
          <ThemeSwitcher />

          <SignedOut>
            <div className="hidden xs:flex items-center space-x-2">
              <SignInButton>
                <Button variant="outline" size="sm">Login</Button>
              </SignInButton>
              <SignUpButton>
                <Button size="sm">Sign Up</Button>
              </SignUpButton>
            </div>
            <div className="flex xs:hidden">
              <SignInButton>
                <Button variant="outline" size="sm">
                  <span className="sr-only">Login</span>
                  Login
                </Button>
              </SignInButton>
            </div>
          </SignedOut>

          <SignedIn>
            <div className="flex items-center gap-2">
              <PlanBadge size="sm" />
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Toggle menu"
              className="h-9 w-9 sm:h-10 sm:w-10"
            >
              {isMenuOpen ? (
                <X className="size-5 sm:size-6" />
              ) : (
                <Menu className="size-5 sm:size-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <nav className="border-t bg-background p-4 md:hidden">
          <ul className="space-y-3">
            {alwaysVisibleLinks.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded px-3 py-3 text-base hover:bg-accent transition-colors"
                  onClick={toggleMenu}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <SignedIn>
              {signedInLinks.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded px-3 py-3 text-base hover:bg-accent transition-colors"
                    onClick={toggleMenu}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </SignedIn>
            <SignedOut>
              <li className="pt-2 border-t">
                <div className="flex flex-col space-y-2">
                  <SignInButton>
                    <Button variant="outline" className="w-full h-11 text-base">
                      Login
                    </Button>
                  </SignInButton>
                  <SignUpButton>
                    <Button className="w-full h-11 text-base">
                      Sign Up
                    </Button>
                  </SignUpButton>
                </div>
              </li>
            </SignedOut>
          </ul>
        </nav>
      )}
    </header>
  )
}
