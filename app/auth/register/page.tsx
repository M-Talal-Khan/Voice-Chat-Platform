"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Radio, Eye, EyeOff, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { StarField } from "@/components/features/star-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import { createClient } from "@/lib/supabase"

const registerSchema = z.object({
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(32, "Username must be at most 32 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterForm) {
    try {
      setError(null)
      setLoading(true)

      const supabase = createClient()
      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
          },
        },
      })

      if (authError) {
        let msg = authError.message
        if (msg.includes("Database error saving new user") || msg.includes("duplicate key value")) {
          msg = "Username is already taken."
        }
        setError(msg)
        setLoading(false)
        return
      }

      router.push("/app")
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg-primary p-4">
      <StarField isAuthPage />
      {/* Background effects */}
      <div className="hero-glow -top-60 left-1/2 -translate-x-1/2 opacity-40" />
      <div className="hero-glow bottom-0 -left-40 opacity-20" style={{ animationDelay: "2s" }} />

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center group"
        >
          <Image
            src="/logo-with-text.svg"
            alt="Thiscord"
            width={160}
            height={40}
            className="w-[160px]"
            style={{ filter: "drop-shadow(0 0 8px rgba(170, 255, 0, 0.6))" }}
          />
        </Link>

        <div className="glass-strong rounded-2xl p-6 shadow-2xl shadow-black/20 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-heading">Join Thiscord</h1>
            <p className="mt-1.5 text-sm text-text-muted text-muted-opacity">
              totally not Discord
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  placeholder="your_handle"
                  autoComplete="username"
                  {...register("username")}
                />
                {errors.username && (
                  <FieldError errors={[{ message: errors.username.message }]} />
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email && (
                  <FieldError errors={[{ message: errors.email.message }]} />
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <FieldError errors={[{ message: errors.password.message }]} />
                )}
              </Field>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive animate-in fade-in slide-in-from-top-1"
                >
                  {error}
                </div>
              )}

              <Button type="submit" size="lg" className="w-full shadow-accent-glow" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </FieldGroup>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-accent-primary underline-offset-4 hover:text-accent-hover hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
