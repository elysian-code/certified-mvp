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

  return (
    <nav className="bg-white shadow-sm border-b" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
            >
              Skip to main content
            </a>

            <Link href="/dashboard" className="flex items-center space-x-2" aria-label="Certified - Go to dashboard">
              <Award className="h-8 w-8 text-blue-600" aria-hidden="true" />
              <span className="text-xl font-bold text-gray-900">Certified</span>
            </Link>

            <div className="hidden md:ml-10 md:flex md:space-x-8" role="menubar">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    role="menuitem"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-sm ${
                      isActive
                        ? "border-b-2 border-blue-500 text-gray-900"
                        : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <item.icon className="h-4 w-4 mr-2" aria-hidden="true" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {profile.organization && (
              <div
                className="hidden sm:block text-sm text-gray-600"
                aria-label={`Organization: ${profile.organization.name}`}
              >
                {profile.organization.name}
              </div>
            )}

            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open navigation menu"
                    aria-expanded={mobileMenuOpen}
                    aria-controls="mobile-menu"
                  >
                    <Menu className="h-6 w-6" aria-hidden="true" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 sm:w-96">
                  <SheetHeader>
                    <SheetTitle className="flex items-center space-x-2">
                      <Award className="h-6 w-6 text-blue-600" aria-hidden="true" />
                      <span>Certified</span>
                    </SheetTitle>
                    <SheetDescription>Navigate through your dashboard</SheetDescription>
                  </SheetHeader>

                  <nav className="mt-6" role="navigation" aria-label="Mobile navigation">
                    <div className="space-y-2">
                      {navigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            onKeyDown={(e) => handleKeyDown(e, item.href)}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              isActive
                                ? "bg-blue-50 text-blue-700 border-l-4 border-blue-500"
                                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                            aria-current={isActive ? "page" : undefined}
                          >
                            <item.icon className="h-5 w-5" aria-hidden="true" />
                            <span>{item.name}</span>
                          </Link>
                        )
                      })}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex items-center space-x-3 px-4 py-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={user.user_metadata?.avatar_url || "/placeholder.svg"}
                            alt={`${profile.full_name}'s avatar`}
                          />
                          <AvatarFallback>{profile.full_name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{profile.full_name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={handleSignOut}
                        className="w-full mt-2 justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                        <span>Sign out</span>
                      </Button>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>

            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label={`User menu for ${profile.full_name}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.user_metadata?.avatar_url || "/placeholder.svg"}
                        alt={`${profile.full_name}'s avatar`}
                      />
                      <AvatarFallback>{profile.full_name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile.full_name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    <span>Log out</span>
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
