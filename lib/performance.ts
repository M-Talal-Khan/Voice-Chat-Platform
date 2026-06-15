import { useVirtualizer } from "@tanstack/react-virtual"
import { debounce, throttle } from "lodash"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

export { useVirtualizer, debounce, throttle, dynamic }

export const usePerformanceDetection = () => {
  const [isLowEnd, setIsLowEnd] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Check hardware
    const checkPerformance = () => {
      const lowEnd =
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
        ((navigator as any).deviceMemory && (navigator as any).deviceMemory <= 2)

      setIsLowEnd(!!lowEnd)

      // Check motion preference
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(motionQuery.matches)

      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
      motionQuery.addEventListener('change', handler)
      return () => motionQuery.removeEventListener('change', handler)
    }

    checkPerformance()
  }, [])

  return { isLowEnd, prefersReducedMotion }
}
