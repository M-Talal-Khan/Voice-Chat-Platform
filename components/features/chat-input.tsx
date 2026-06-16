"use client"

import { useState, useRef, useEffect, useCallback, memo } from "react"
import { Send, Loader2, Paperclip, X, FileText, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import { compressImage } from "@/lib/media-utils"
import { toast } from "@/hooks/use-toast"
import { debounce } from "lodash"

export interface FileAttachment {
  file: File
  previewUrl?: string
  progress: number
  error?: string
  uploadedUrl?: string
  uploadedSize?: number
  uploadedType?: string
  originalSize?: number
}

interface ChatInputProps {
  placeholder: string
  onSendMessage: (content: string, attachments: FileAttachment[]) => Promise<void>
  onTyping?: () => void
  disabled?: boolean
  replyToPreview?: React.ReactNode
  onReplyClear?: () => void
  channelName?: string
}

export const ChatInput = memo(({
  placeholder,
  onSendMessage,
  onTyping,
  disabled,
  replyToPreview,
  onReplyClear,
  channelName,
}: ChatInputProps) => {
  const [content, setContent] = useState("")
  const [sending, setSending] = useState(false)
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = async () => {
    if ((!content.trim() && attachments.length === 0) || sending || disabled) return

    setSending(true)
    const currentContent = content.trim()
    const currentAttachments = [...attachments]
    
    setContent("")
    setAttachments([])
    onReplyClear?.()
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    try {
      await onSendMessage(currentContent, currentAttachments)
    } catch (err) {
      setContent(currentContent)
      setAttachments(currentAttachments)
      toast("Failed to send message", { variant: "destructive" })
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  const debouncedTyping = useRef(debounce(() => {
    onTyping?.()
  }, 500)).current

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    if (e.target.value.length > 0) {
      debouncedTyping()
    }
    
    // Auto resize
    e.target.style.height = "auto"
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
  }

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const newAttachments: FileAttachment[] = []
    
    for (const file of Array.from(files)) {
      if (attachments.length + newAttachments.length >= 10) break
      
      const isImage = file.type.startsWith("image/")
      const maxSize = isImage ? 8 * 1024 * 1024 : 25 * 1024 * 1024
      
      if (file.size > maxSize) {
        toast(`File ${file.name} is too large`, {
          description: `Max size is ${isImage ? '8MB' : '25MB'}.`,
          variant: "destructive"
        })
        continue
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'txt', 'zip', 'mp3', 'mp4']
      if (!allowedExts.includes(ext)) {
        toast(`File ${file.name} unsupported`, {
          description: "Format not allowed.",
          variant: "destructive"
        })
        continue
      }

      let processedFile = file
      let previewUrl: string | undefined
      let originalSize = file.size
      
      if (isImage) {
        try {
          const res = await compressImage(file)
          processedFile = res.file
          originalSize = res.originalSize
          previewUrl = URL.createObjectURL(processedFile)
        } catch (e) {
          // Fallback to original
        }
      }

      newAttachments.push({
        file: processedFile,
        previewUrl,
        progress: 0,
        originalSize
      })
    }

    if (newAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...newAttachments])
    }
    
    if (fileRef.current) fileRef.current.value = ""
  }, [attachments.length])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const newAtt = [...prev]
      if (newAtt[index].previewUrl) URL.revokeObjectURL(newAtt[index].previewUrl!)
      newAtt.splice(index, 1)
      return newAtt
    })
  }

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(true)
    }
    
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      if (e.relatedTarget === null || !document.body.contains(e.relatedTarget as Node)) {
         setIsDragging(false)
      }
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer?.files) {
        processFiles(e.dataTransfer.files)
      }
    }

    document.body.addEventListener("dragover", handleDragOver)
    document.body.addEventListener("dragleave", handleDragLeave)
    document.body.addEventListener("drop", handleDrop)

    return () => {
      document.body.removeEventListener("dragover", handleDragOver)
      document.body.removeEventListener("dragleave", handleDragLeave)
      document.body.removeEventListener("drop", handleDrop)
    }
  }, [processFiles])

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        processFiles(e.clipboardData.files)
      }
    }
    document.addEventListener("paste", handlePaste)
    return () => document.removeEventListener("paste", handlePaste)
  }, [processFiles])

  return (
    <div className="relative shrink-0 border-t border-border-subtle px-4 py-3 bg-bg-primary z-10">
      {isDragging && (
        <div className="absolute inset-x-0 bottom-0 z-50 flex h-full items-center justify-center rounded-lg border-2 border-dashed border-[#AAFF00] bg-black/80 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="size-8 text-[#AAFF00]" />
            <p className="font-bold text-[#AAFF00]">
              Drop to upload to {channelName ? `#${channelName}` : "chat"}
            </p>
          </div>
        </div>
      )}

      {replyToPreview}

      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-bg-secondary p-2">
          {attachments.map((att, idx) => (
            <div key={idx} className="relative group flex h-24 w-24 shrink-0 flex-col items-center justify-center overflow-hidden rounded-md border border-border-subtle bg-surface">
              {att.previewUrl ? (
                <>
                  <Image src={att.previewUrl} alt="Preview" fill className="object-cover" />
                  {att.originalSize && att.originalSize > att.file.size && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 text-center text-[9px] font-medium text-[#AAFF00] backdrop-blur-sm">
                      {(att.originalSize / 1024 / 1024).toFixed(1)}MB &rarr; {(att.file.size / 1024).toFixed(0)}KB
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center p-2 text-center text-[10px] text-text-muted leading-tight">
                  <FileText className="mb-1 size-6" />
                  <span className="w-full truncate font-medium">{att.file.name}</span>
                  <span className="mt-0.5 opacity-70">
                    {(att.file.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeAttachment(idx)}
                className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 rounded-lg border border-border-subtle bg-bg-secondary px-3 py-2 transition-colors focus-within:border-accent-primary focus-within:shadow-accent-focus">
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.zip,.mp3,.mp4"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled || sending}
          className="rounded p-1 text-text-muted transition-colors hover:text-text-primary disabled:opacity-50 mb-1"
          title="Attach files"
        >
          <Paperclip className="size-4" />
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          value={content}
          onChange={handleContentChange}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted resize-none py-1 min-h-[20px] max-h-[200px]"
          disabled={sending || disabled}
          onKeyDown={(e) => {
             if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
             }
          }}
        />
        <div className="text-[10px] text-text-muted mb-2 mr-1">
           {content.length}/2000
        </div>
        <button
          onClick={handleSend}
          disabled={(!content.trim() && attachments.length === 0) || sending || disabled}
          className="rounded-md bg-accent-primary p-1.5 font-bold text-bg-primary transition-all hover:bg-accent-hover active:scale-[0.97] disabled:opacity-50 mb-0.5"
        >
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </button>
      </div>
    </div>
  )
})

ChatInput.displayName = "ChatInput"
