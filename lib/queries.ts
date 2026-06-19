"use server"

import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { Server } from "@/lib/types"

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // ignore
          }
        },
      },
    },
  )
}

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}

export async function joinServerAction(inviteCode: string): Promise<Server> {
  const code = inviteCode.trim()
  if (!code) {
    throw new Error("Invite code is required")
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("You need to be signed in to join a server")
  }

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: server, error: serverError } = await supabaseAdmin
    .from("servers")
    .select("*")
    .eq("invite_code", code)
    .single()

  if (serverError || !server) {
    throw new Error("Invalid invite code. Please check and try again.")
  }

  const { data: existing } = await supabaseAdmin
    .from("server_members")
    .select("id")
    .eq("server_id", server.id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) {
    throw new Error("You are already a member of this server")
  }

  const { error: joinError } = await supabaseAdmin
    .from("server_members")
    .insert({
      server_id: server.id,
      user_id: user.id,
      role: "member",
    })

  if (joinError) {
    if (joinError.code === "23505") {
      throw new Error("You are already a member of this server")
    }
    throw new Error(joinError.message)
  }

  return server
}
