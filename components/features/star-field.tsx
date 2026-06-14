"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface StarFieldProps {
  className?: string
  isAuthPage?: boolean
}

export function StarField({ className, isAuthPage = false }: StarFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let stars: any[] = []
    
    // Mouse state
    let mouse = {
      x: -1000,
      y: -1000,
      radius: 150
    }

    const numStars = isAuthPage ? 80 : 180
    const colors = ["#141414", "#1A1A1A", "#AAFF00"]

    function resize() {
      if (canvas) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        init()
      }
    }

    function init() {
      stars = []
      if (!canvas) return
      for (let i = 0; i < numStars; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const radius = Math.random() * 2 + 1
        const color = colors[Math.floor(Math.random() * colors.length)]
        stars.push(new Star(x, y, radius, color))
      }
    }

    class Star {
      x: number
      y: number
      baseX: number
      baseY: number
      radius: number
      color: string
      vx: number
      vy: number

      constructor(x: number, y: number, radius: number, color: string) {
        this.x = x
        this.y = y
        this.baseX = x
        this.baseY = y
        this.radius = radius
        this.color = color
        this.vx = 0
        this.vy = 0
      }

      draw() {
        if (!ctx) return
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = this.color
        
        // Add glow for accent color
        if (this.color === "#AAFF00") {
          ctx.shadowBlur = 10
          ctx.shadowColor = "#AAFF00"
        } else {
          ctx.shadowBlur = 0
        }
        
        ctx.fill()
        ctx.closePath()
      }

      update() {
        // Repulsion from mouse
        const dx = mouse.x - this.x
        const dy = mouse.y - this.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const maxDistance = mouse.radius

        if (distance < maxDistance) {
          const forceDirectionX = dx / distance
          const forceDirectionY = dy / distance
          const force = (maxDistance - distance) / maxDistance
          const directionX = forceDirectionX * force * -5
          const directionY = forceDirectionY * force * -5

          this.vx += directionX
          this.vy += directionY
        }

        // Spring back to base position
        const springDx = this.baseX - this.x
        const springDy = this.baseY - this.y
        this.vx += springDx * 0.05
        this.vy += springDy * 0.05

        // Friction
        this.vx *= 0.8
        this.vy *= 0.8

        this.x += this.vx
        this.y += this.vy

        // Subtle floating animation
        this.baseY += Math.sin(Date.now() * 0.001 + this.baseX) * 0.5
        this.baseX += Math.cos(Date.now() * 0.001 + this.baseY) * 0.5

        this.draw()
      }
    }

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < stars.length; i++) {
        stars[i].update()
      }
      animationFrameId = requestAnimationFrame(animate)
    }

    window.addEventListener("resize", resize)
    
    const handlePointerMove = (e: PointerEvent | MouseEvent | TouchEvent) => {
      if (e instanceof TouchEvent) {
        mouse.x = e.touches[0].clientX
        mouse.y = e.touches[0].clientY
      } else {
        mouse.x = (e as MouseEvent).clientX
        mouse.y = (e as MouseEvent).clientY
      }
    }
    
    window.addEventListener("mousemove", handlePointerMove)
    window.addEventListener("touchmove", handlePointerMove)

    resize()
    animate()

    return () => {
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", handlePointerMove)
      window.removeEventListener("touchmove", handlePointerMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [isAuthPage])

  return (
    <canvas
      ref={canvasRef}
      className={cn("pointer-events-none absolute inset-0 z-0", className)}
      style={{ width: "100%", height: "100%" }}
    />
  )
}
