"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Award, Building, Users, FileText, Settings, LogOut, User, Menu } from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface Profile {
  id: string
  full_name: string
  role: string
  organization: {
    id: string
    name: string
  } | null
}

interface DashboardNavProps {
  user: SupabaseUser
  profile: Profile
}

export function DashboardNav({ user, profile }: DashboardNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const isOrganizationAdmin = profile.role === "organization_admin"

  const navigation = isOrganizationAdmin
    ? [
        { name: "Overview", href: "/dashboard/organization", icon: Building },
        { name: "Programs", href: "/dashboard/organization/programs", icon: Award },
        { name: "Employees", href: "/dashboard/organization/employees", icon: Users },
        { name: "Certificates", href: "/dashboard/organization/certificates", icon: FileText },
        { name: "Settings", href: "/dashboard/organization/settings", icon: Settings },
      ]
    : [
        { name: "Overview", href: "/dashboard/employee", icon: User },
        { name: "My Programs", href: "/dashboard/employee/programs", icon: Award },
        { name: "Certificates", href: "/dashboard/employee/certificates", icon: FileText },
        { name: "Settings", href: "/dashboard/employee/settings", icon: Settings },
      ]

  const handleKeyDown = (event: React.KeyboardEvent, href: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      router.push(href)
      setMobileMenuOpen(false)
    }
  }

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <nav
      className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-indigo-600 text-white px-4 py-2 rounded-md z-50"
            >
              Skip to main content
            </a>
            <Link
              href="/dashboard"
              className="flex items-center space-x-2.5"
              aria-label="Certified — Go to dashboard"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
                <Award className="h-4 w-4 text-white" aria-hidden="true" />
              </div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">Certified</span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1" role="menubar">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    role="menuitem"
                    className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Org badge */}
            {profile.organization && (
              <div
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600 max-w-[160px] truncate"
                aria-label={`Organization: ${profile.organization.name}`}
              >
                <Building className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
                <span className="truncate">{profile.organization.name}</span>
              </div>
            )}

            {/* Mobile menu */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open navigation menu"
                    aria-expanded={mobileMenuOpen}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <Menu className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader className="px-5 pt-5 pb-4 border-b border-gray-100">
                    <SheetTitle className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <Award className="h-4 w-4 text-white" aria-hidden="true" />
                      </div>
                      <span className="text-base font-bold tracking-tight">Certified</span>
                    </SheetTitle>
                    <SheetDescription className="text-xs text-gray-400 mt-0.5">
                      {isOrganizationAdmin ? "Organization Admin" : "Learner Portal"}
                    </SheetDescription>
                  </SheetHeader>

                  <nav className="px-3 py-4" role="navigation" aria-label="Mobile navigation">
                    <div className="space-y-0.5">
                      {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            onKeyDown={(e) => handleKeyDown(e, item.href)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                              isActive
                                ? "bg-indigo-50 text-indigo-700"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                            aria-current={isActive ? "page" : undefined}
                          >
                            <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>{item.name}</span>
                          </Link>
                        )
                      })}
                    </div>

                    <div className="mt-6 pt-5 border-t border-gray-100">
                      <div className="flex items-center gap-3 px-3 mb-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={user.user_metadata?.avatar_url || ""}
                            alt={`${profile.full_name}'s avatar`}
                          />
                          <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{profile.full_name}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={handleSignOut}
                        className="w-full justify-start text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <LogOut className="mr-2.5 h-4 w-4" aria-hidden="true" />
                        Sign out
                      </Button>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop user menu */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full p-0 hover:ring-2 hover:ring-indigo-200 transition-all"
                    aria-label={`User menu for ${profile.full_name}`}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={user.user_metadata?.avatar_url || ""}
                        alt={`${profile.full_name}'s avatar`}
                      />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal pb-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <p className="text-sm font-semibold leading-none truncate">{profile.full_name}</p>
                        <p className="text-xs leading-none text-muted-foreground mt-1 truncate">{user.email}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-500 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
