"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle } from "lucide-react"

interface SecureFormProps {
  onSubmit: (data: any) => Promise<void>
  children: React.ReactNode
  className?: string
  maxAttempts?: number
  cooldownMs?: number
}

export function SecureForm({
  onSubmit,
  children,
  className = "",
  maxAttempts = 5,
  cooldownMs = 60000, // 1 minute
}: SecureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (cooldownUntil && Date.now() < cooldownUntil) {
        const remainingSeconds = Math.ceil((cooldownUntil - Date.now()) / 1000)
        setError(`Too many attempts. Please wait ${remainingSeconds} seconds before trying again.`)
        return
      }

      if (attempts >= maxAttempts) {
        const cooldownEnd = Date.now() + cooldownMs
        setCooldownUntil(cooldownEnd)
        setError(`Maximum attempts exceeded. Please wait ${cooldownMs / 1000} seconds before trying again.`)
        return
      }

      setIsSubmitting(true)
      setError(null)

      try {
        const formData = new FormData(event.currentTarget)
        const data = Object.fromEntries(formData.entries())

        const sanitizedData = Object.entries(data).reduce((acc, [key, value]) => {
          if (typeof value === "string") {
            acc[key] = value.trim().slice(0, 10000) // Limit input length
          } else {
            acc[key] = value
          }
          return acc
        }, {} as any)

        await onSubmit(sanitizedData)

        // Reset attempts on success
        setAttempts(0)
        setCooldownUntil(null)
      } catch (err) {
        setAttempts((prev) => prev + 1)

        if (err instanceof Error) {
          const sanitizedMessage = err.message.replace(/[<>]/g, "").slice(0, 200)
          setError(sanitizedMessage)
        } else {
          setError("An unexpected error occurred. Please try again.")
        }
      } finally {
        setIsSubmitting(false)
      }
    },
    [onSubmit, attempts, maxAttempts, cooldownUntil, cooldownMs],
  )

  return (
    <form onSubmit={handleSubmit} className={className}>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {children}

      <Button type="submit" disabled={isSubmitting || (cooldownUntil && Date.now() < cooldownUntil)} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          "Submit"
        )}
      </Button>

      {attempts > 0 && attempts < maxAttempts && (
        <p className="text-sm text-muted-foreground mt-2">Attempts remaining: {maxAttempts - attempts}</p>
      )}
    </form>
  )
}
