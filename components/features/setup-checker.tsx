"use client"

import { useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"
import { createClient } from "@/lib/supabase"
import { AlertTriangle, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function SetupChecker() {
  const currentUser = useAppStore(state => state.currentUser)
  const storageError = useAppStore(state => state.storageError)
  const setStorageError = useAppStore(state => state.setStorageError)
  const selectedServer = useAppStore(state => state.selectedServer)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!currentUser) return

    const supabase = createClient()

    const checkSetup = async () => {
      try {
        const { error } = await supabase.storage.from('attachments').list('', { limit: 1 })
        if (error) {
          setStorageError(true)
        } else {
          setStorageError(false)
        }
      } catch (err) {
        setStorageError(true)
      }
    }

    checkSetup()
  }, [currentUser, setStorageError])

  // Only show to server owners or admins (mocking role check based on selected server)
  const canSeeBanner = selectedServer?.owner_id === currentUser?.id

  if (!storageError || dismissed || !canSeeBanner) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-warning text-bg-primary px-4 py-2 flex items-center justify-between gap-4 z-[100] sticky top-0"
      >
        <div className="flex items-center gap-2 text-sm font-bold">
          <AlertTriangle className="size-4" />
          <span>File uploads not configured. Run storage-setup.sql in Supabase.</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="hover:bg-black/10 rounded p-1 transition-colors"
        >
          <X className="size-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
