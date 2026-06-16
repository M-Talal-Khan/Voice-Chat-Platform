"use client"

import { useEffect, useRef, memo } from "react"
import data from "@emoji-mart/data"
import { Picker } from "emoji-mart"

interface EmojiData {
  native: string
  [key: string]: any
}

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  onClickOutside?: () => void
}

export const EmojiPicker = memo(({ onEmojiSelect, onClickOutside }: EmojiPickerProps) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const picker = new (Picker as any)({
      parent: ref.current,
      data,
      onEmojiSelect: (emoji: EmojiData) => {
        onEmojiSelect(emoji.native)
      },
      onClickOutside: () => {
        onClickOutside?.()
      },
      theme: "dark",
      skinTonePosition: "none",
      previewPosition: "none",
    })
  }, [onEmojiSelect, onClickOutside])

  return <div ref={ref} className="emoji-picker-container" />
})

EmojiPicker.displayName = "EmojiPicker"
