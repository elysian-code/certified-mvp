"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { User, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import debounce from "lodash/debounce"

interface Employee {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  role: string
}

interface EmployeeSearchProps {
  onSelect: (employee: Employee) => void
  excludeIds?: string[]
  className?: string
}

export function EmployeeSearch({ onSelect, excludeIds = [], className = "" }: EmployeeSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const abortController = useRef<AbortController | null>(null)

  const searchEmployees = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        return
      }

      try {
        // Cancel previous request if it exists
        if (abortController.current) {
          abortController.current.abort()
        }

        // Create new abort controller for this request
        abortController.current = new AbortController()
        setLoading(true)
        setError("")

        const response = await fetch(
          `/api/employee-search?q=${encodeURIComponent(searchQuery)}${
            excludeIds.length ? `&exclude=${excludeIds.join(",")}` : ""
          }`,
          {
            signal: abortController.current.signal,
          },
        )

        if (!response.ok) {
          throw new Error("Failed to search employees")
        }

        const data = await response.json()
        setResults(data.employees)
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Ignore abort errors
          return
        }
        setError("Failed to search employees")
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300),
    [excludeIds],
  )

  useEffect(() => {
    searchEmployees(query)

    return () => {
      if (abortController.current) {
        abortController.current.abort()
      }
    }
  }, [query, searchEmployees])

  return (
    <div className={className}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          type="text"
          placeholder="Search employees by name or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      )}

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

      {!loading && !error && results.length > 0 && (
        <Card className="mt-2 max-h-64 overflow-y-auto p-2">
          {results.map((employee) => (
            <Button
              key={employee.id}
              variant="ghost"
              className="w-full justify-start gap-3 mb-1"
              onClick={() => onSelect(employee)}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={employee.avatar_url || undefined} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="font-medium">{employee.full_name}</span>
                <span className="text-sm text-gray-500">{employee.email}</span>
              </div>
            </Button>
          ))}
        </Card>
      )}

      {!loading && !error && query && results.length === 0 && (
        <p className="text-sm text-gray-500 mt-2">No employees found</p>
      )}
    </div>
  )
}