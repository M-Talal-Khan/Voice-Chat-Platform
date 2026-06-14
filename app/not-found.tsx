import Link from "next/link"
import { Radio } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-bg-primary px-4 py-10">
      <div className="hero-glow -top-60 left-1/2 -translate-x-1/2 opacity-40" />
      <div className="hero-glow bottom-0 -right-40 opacity-20" />

      <div className="relative z-10 w-full max-w-md animate-fade-in-up text-center">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 group mx-auto"
        >
          <span className="flex size-10 items-center justify-center rounded-server bg-accent-primary text-bg-primary shadow-accent-glow transition-transform group-hover:scale-105">
            <Radio className="size-5" />
          </span>
          <span className="text-xl font-bold tracking-heading">Thiscord</span>
        </Link>

        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          This page doesn&apos;t exist. Unlike our originality.
        </p>

        <Button asChild size="lg">
          <Link href="/">Return to civilization</Link>
        </Button>
      </div>
    </div>
  )
}
