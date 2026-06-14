export async function compressImage(file: File): Promise<{ file: File; width: number; height: number; originalSize: number }> {
  const originalSize = file.size
  
  // Only compress images that aren't GIFs or SVGs
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    try {
      const dims = await getImageDimensions(file)
      return { file, width: dims.width, height: dims.height, originalSize }
    } catch {
      return { file, width: 0, height: 0, originalSize }
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const MAX_WIDTH = 1280
        const MAX_HEIGHT = 1280
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height *= MAX_WIDTH / width))
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width *= MAX_HEIGHT / height))
            height = MAX_HEIGHT
          }
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve({ file, width: img.width, height: img.height, originalSize })
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        
        const format = "image/jpeg"

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ file, width, height, originalSize })
              return
            }
            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
              type: format,
              lastModified: Date.now(),
            })
            resolve({ file: newFile, width, height, originalSize })
          },
          format,
          0.82
        )
      }
      img.onerror = () => resolve({ file, width: 0, height: 0, originalSize })
    }
    reader.onerror = () => resolve({ file, width: 0, height: 0, originalSize })
  })
}

export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      resolve({ width: 0, height: 0 })
      return
    }
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}
