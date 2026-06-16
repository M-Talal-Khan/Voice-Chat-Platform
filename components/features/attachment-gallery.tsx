import { useState, useEffect } from "react"
import { FileText, X, Download } from "lucide-react"
import type { Attachment } from "@/lib/types"
import Image from "next/image"

export function AttachmentGallery({ attachments }: { attachments: Attachment[] }) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!lightboxUrl) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxUrl(null)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lightboxUrl])

  if (!attachments || attachments.length === 0) return null

  return (
    <>
      <div className="flex flex-col">
        {attachments.map((attachment) => {
          const isImage =
            attachment.is_image === true ||
            attachment.file_type?.startsWith("image/") ||
            ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(
              attachment.file_name?.split(".").pop()?.toLowerCase() ?? ""
            )

          if (isImage) {
            return (
              <div key={attachment.id} className="mt-2 relative">
                <div 
                  className="relative max-w-[400px] aspect-video overflow-hidden rounded-lg cursor-pointer"
                  onClick={() => setLightboxUrl(attachment.file_url)}
                >
                  <Image
                    src={attachment.file_url}
                    alt={attachment.file_name}
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                </div>
              </div>
            )
          }

          return (
            <div key={attachment.id} className="mt-2">
              <a
                href={attachment.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-fit items-center gap-3 rounded-lg border border-border-subtle bg-surface px-4 py-3 transition-colors hover:bg-surface-hover"
              >
                <FileText className="size-6 shrink-0 text-muted-foreground" />
                <div className="min-w-0 text-left">
                  <p className="max-w-[200px] truncate font-medium text-foreground">
                    {attachment.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {attachment.file_size > 1024 * 1024
                      ? `${(attachment.file_size / 1024 / 1024).toFixed(1)} MB`
                      : `${(attachment.file_size / 1024).toFixed(0)} KB`}
                  </p>
                </div>
                <div className="ml-2 flex items-center justify-center rounded-md bg-bg-secondary p-2 transition-colors hover:bg-bg-primary">
                  <Download className="size-4" />
                </div>
              </a>
            </div>
          )
        })}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute right-4 top-4 rounded-full bg-surface/20 p-2 text-white transition-colors hover:bg-surface/40 z-[60]"
          >
            <X className="size-6" />
          </button>
          
          <div className="relative size-full flex items-center justify-center">
            <Image
              src={lightboxUrl}
              alt="Preview"
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  )
}
