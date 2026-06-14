"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

import { StarField } from "@/components/features/star-field"
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion"

/* ─── Starburst SVG (pre-computed path to avoid hydration mismatch) ── */
const STARBURST_PATH =
  "M200,0 L223.4,82.3 L276.5,15.2 L266.7,100.2 L341.4,58.6 L299.8,133.3 L384.8,123.5 L317.7,176.6 L400,200 L317.7,223.4 L384.8,276.5 L299.8,266.7 L341.4,341.4 L266.7,299.8 L276.5,384.8 L223.4,317.7 L200,400 L176.6,317.7 L123.5,384.8 L133.3,299.8 L58.6,341.4 L100.2,266.7 L15.2,276.5 L82.3,223.4 L0,200 L82.3,176.6 L15.2,123.5 L100.2,133.3 L58.6,58.6 L133.3,100.2 L123.5,15.2 L176.6,82.3 Z"

function StarburstShape({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      fill="#AAFF00"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={STARBURST_PATH} />
    </svg>
  )
}


/* ─── Grain Overlay ─────────────────────────────────────── */
function GrainOverlay() {
  return (
    <div
      className="grain-overlay"
      aria-hidden="true"
    />
  )
}

/* ─── Main Landing Page ─────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasMounted, setHasMounted] = useState(false)

  // Mouse position for parallax + repulsion
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Starburst repulsion springs

  const repelX = useSpring(0, { stiffness: 100, damping: 20 })
  const repelY = useSpring(0, { stiffness: 100, damping: 20 })

  // Parallax transforms for text layers
  const parallaxX1 = useTransform(mouseX, [-1, 1], [15, -15])
  const parallaxY1 = useTransform(mouseY, [-1, 1], [10, -10])
  const parallaxX2 = useTransform(mouseX, [-1, 1], [-10, 10])
  const parallaxY2 = useTransform(mouseY, [-1, 1], [-8, 8])

  useEffect(() => {
    setHasMounted(true)
  }, [])

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1
    mouseX.set(normX)
    mouseY.set(normY)

    // Starburst repulsion
    // Starburst center is approximately at 70% from left, 50% from top
    const starCenterX = rect.left + rect.width * 0.72
    const starCenterY = rect.top + rect.height * 0.45

    const dx = e.clientX - starCenterX
    const dy = e.clientY - starCenterY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const maxDist = 400
    const maxRepel = 150

    if (dist < maxDist) {
      const strength = 1 - dist / maxDist
      const angle = Math.atan2(dy, dx)
      repelX.set(-Math.cos(angle) * maxRepel * strength)
      repelY.set(-Math.sin(angle) * maxRepel * strength)
    } else {
      repelX.set(0)
      repelY.set(0)
    }
  }

  function handleMouseLeave() {
    repelX.set(0)
    repelY.set(0)
    mouseX.set(0)
    mouseY.set(0)
  }

  // Animation variants
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  }

  const textSlideUp = {
    hidden: { y: 100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } as any,
    },
  }

  const starburstVariant = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.7, delay: 0.6, ease: [0.34, 1.56, 0.64, 1] } as any,
    },
  }

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 1, delay: 1 },
    },
  }

  return (
    <div
      ref={containerRef}
      className="landing-root"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <GrainOverlay />

      {/* Radial gradient center glow */}
      <div className="landing-center-glow" aria-hidden="true" />

      {/* Background Star Field */}
      <StarField />

      {/* Dark vignette edges */}
      <div className="landing-vignette" aria-hidden="true" />

      <motion.div
        className="landing-content"
        variants={containerVariants}
        initial="hidden"
        animate={hasMounted ? "visible" : "hidden"}
      >
        {/* ── Top Left: Thiscord Logo ── */}
        <motion.div className="landing-logo" variants={textSlideUp}>
          <Image
            src="/logo-with-text.svg"
            alt="Thiscord"
            width={200}
            height={50}
            className="w-[200px]"
            style={{ filter: "drop-shadow(0 0 8px rgba(170, 255, 0, 0.6))" }}
          />
        </motion.div>

        {/* ── Ghost Background Text ── */}
        <motion.div
          className="landing-ghost-text"
          variants={fadeIn}
          aria-hidden="true"
        >
          <motion.span style={{ x: parallaxX2, y: parallaxY2 }}>
            dddddiscord
          </motion.span>
        </motion.div>

        {/* ── Hero Typography ── */}
        <div className="landing-hero-text">
          <div className="landing-hero-text-overflow-clip">
            <motion.h1
              className="landing-hero-line1"
              variants={textSlideUp}
              style={{ x: parallaxX1, y: parallaxY1 }}
            >
              not
            </motion.h1>
          </div>
          <div className="landing-hero-text-overflow-clip">
            <motion.h1
              className="landing-hero-line2"
              variants={textSlideUp}
              style={{ x: parallaxX2, y: parallaxY2 }}
            >
              Discord.
            </motion.h1>
          </div>
        </div>

        {/* ── Starburst with CTA ── */}
        <motion.div
          className="landing-starburst-container"
          variants={starburstVariant}
          style={{ x: repelX, y: repelY }}
        >
          <motion.div
            className="landing-starburst-inner"
            animate={{ rotate: 360 }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <StarburstShape className="landing-starburst-svg" />
          </motion.div>
          <button
            className="landing-starburst-cta"
            onClick={() => router.push("/auth/register")}
            id="cta-start-talking"
          >
            start<br />talking
          </button>
        </motion.div>

        {/* ── Bottom Left: Tagline ── */}
        <motion.p className="landing-tagline" variants={fadeIn}>
          totally original. promise.
        </motion.p>

        {/* ── Easter Eggs ── */}
        <motion.p className="landing-easter-egg-1" variants={fadeIn}>
          discord at home
        </motion.p>
        <motion.p className="landing-easter-egg-2" variants={fadeIn}>
          made by people who forgot to buy discord nitro
        </motion.p>
      </motion.div>
    </div>
  )
}
