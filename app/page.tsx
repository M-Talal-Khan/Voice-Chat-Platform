import Link from "next/link"
import {
  Mic,
  MessageSquare,
  Users,
  Shield,
  Headphones,
  Zap,
  Radio,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  {
    icon: Mic,
    title: "Crystal-clear voice",
    description:
      "Drop into a voice channel with one click. Low-latency audio built for long sessions and big rooms.",
  },
  {
    icon: MessageSquare,
    title: "Organized text channels",
    description:
      "Keep conversations tidy with dedicated channels, replies, reactions, and pinned messages.",
  },
  {
    icon: Users,
    title: "Communities that scale",
    description:
      "Spin up servers for your team, your guild, or your friends. Roles and member lists included.",
  },
  {
    icon: Shield,
    title: "Yours to control",
    description:
      "Granular settings, invite links, and moderation tools so your space stays exactly how you want it.",
  },
  {
    icon: Headphones,
    title: "Mute, deafen, done",
    description:
      "Familiar voice controls right where you expect them. Manage your mic and audio in a single tap.",
  },
  {
    icon: Zap,
    title: "Fast and lightweight",
    description:
      "A snappy interface that gets out of your way so you can focus on the conversation.",
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Radio className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">Thiscord</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#communities" className="transition-colors hover:text-foreground">
              Communities
            </a>
            <a href="#voice" className="transition-colors hover:text-foreground">
              Voice
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/register">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="relative overflow-hidden">
          {/* Background glows */}
          <div className="hero-glow -top-40 left-1/2 -translate-x-1/2" />
          <div className="hero-glow top-40 -left-40 opacity-40" style={{ animationDelay: "2s" }} />
          <div className="hero-glow top-20 -right-40 opacity-30" style={{ animationDelay: "4s", background: "radial-gradient(circle, oklch(0.55 0.13 250 / 12%) 0%, transparent 70%)" }} />

          <div className="mx-auto w-full max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28 relative z-10">
            <div className="animate-fade-in-up mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/80 backdrop-blur-sm px-4 py-1.5 text-xs text-muted-foreground shadow-lg shadow-black/5">
              <span className="relative inline-block size-2 rounded-full bg-[var(--color-online)]">
                <span className="absolute inset-0 animate-ping rounded-full bg-[var(--color-online)] opacity-50" />
              </span>
              Voice &amp; text chat for every community
            </div>
            <h1 className="animate-fade-in-up-delay mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
              Where your community{" "}
              <span className="text-gradient">comes to talk</span>
            </h1>
            <p className="animate-fade-in-up-delay-2 mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Thiscord brings your people together with high-quality voice rooms,
              organized text channels, and the tools to run a thriving community.
            </p>
            <div className="animate-fade-in-up-delay-2 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
                <Link href="/app">
                  <Users className="size-4" data-icon="inline-start" />
                  Join a Server
                  <ArrowRight className="size-4 ml-1 transition-transform group-hover/button:translate-x-0.5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Link href="/app">
                  <Radio className="size-4" data-icon="inline-start" />
                  Create Server
                </Link>
              </Button>
            </div>

            {/* App preview mock */}
            <div className="mx-auto mt-16 max-w-4xl animate-float" style={{ animationDuration: "8s" }}>
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/30 ring-1 ring-white/5">
                <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3 bg-background/30">
                  <span className="size-3 rounded-full bg-[var(--color-dnd)]" />
                  <span className="size-3 rounded-full bg-[var(--color-idle)]" />
                  <span className="size-3 rounded-full bg-[var(--color-online)]" />
                  <span className="ml-auto text-[11px] text-muted-foreground/60">Thiscord — Resonate HQ</span>
                </div>
                <div className="flex h-72 text-left">
                  <div className="hidden w-14 flex-col items-center gap-3 bg-rail py-4 sm:flex">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20">
                      RH
                    </span>
                    <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-xs text-secondary-foreground transition-all hover:rounded-2xl">
                      DG
                    </span>
                    <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-xs text-secondary-foreground transition-all hover:rounded-2xl">
                      GN
                    </span>
                  </div>
                  <div className="hidden w-44 flex-col gap-1 bg-channels p-3 lg:flex">
                    <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Text Channels
                    </p>
                    <span className="rounded-md bg-primary/15 px-2 py-1 text-sm text-foreground">
                      # general
                    </span>
                    <span className="px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
                      # dev-talk
                    </span>
                    <span className="px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
                      # design
                    </span>
                    <p className="mt-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Voice Channels
                    </p>
                    <span className="flex items-center gap-1.5 px-2 py-1 text-sm text-muted-foreground">
                      <Mic className="size-3.5" /> Lobby
                      <span className="ml-auto flex -space-x-1">
                        <span className="size-4 rounded-full bg-chart-1 ring-1 ring-channels" />
                        <span className="size-4 rounded-full bg-chart-3 ring-1 ring-channels" />
                        <span className="size-4 rounded-full bg-chart-4 ring-1 ring-channels" />
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col bg-chat p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-chart-1 text-xs font-semibold text-primary-foreground">
                        NV
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          nova{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            9:02 AM
                          </span>
                        </p>
                        <p className="text-sm text-foreground/90">
                          morning everyone, pushed the new voice channel UI last night
                        </p>
                        <div className="mt-1.5 flex gap-1">
                          <span className="inline-flex items-center gap-0.5 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-xs">🔥 4</span>
                          <span className="inline-flex items-center gap-0.5 rounded-full border border-border px-1.5 py-0.5 text-xs text-muted-foreground">🚀 2</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-start gap-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-chart-3 text-xs font-semibold text-primary-foreground">
                        LM
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          lumen{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            9:04 AM
                          </span>
                        </p>
                        <p className="text-sm text-foreground/90">
                          looks slick! the avatars stacking inside the channel row is a nice touch
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto flex items-center gap-2 rounded-lg bg-background/40 px-3 py-2 text-sm text-muted-foreground ring-1 ring-white/5">
                      <span className="opacity-50">💬</span>
                      Message #general
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="relative border-t border-border/60 bg-card/20">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Everything your community needs
              </h2>
              <p className="mt-4 text-pretty text-muted-foreground">
                From late-night gaming sessions to focused work sprints, Thiscord
                has the channels and controls to keep everyone in sync.
              </p>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, i) => (
                <div
                  key={feature.title}
                  className="card-glow rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6 transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <span className="flex size-11 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/10">
                    <feature.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="voice" className="relative overflow-hidden border-t border-border/60">
          {/* Background accent */}
          <div className="hero-glow left-1/2 top-0 -translate-x-1/2 opacity-30" />

          <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/10">
              <Headphones className="size-8" />
            </div>
            <h2 className="mt-6 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to start talking?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-pretty text-muted-foreground">
              Create your first server in seconds. No downloads, no friction —
              just your community and a place to gather.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="shadow-lg shadow-primary/25">
                <Link href="/auth/register">Get started free</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/app">Explore the app</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="communities" className="border-t border-border/60 bg-rail/50">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Radio className="size-4" />
            </span>
            <span className="text-sm font-medium">Thiscord</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Voice &amp; text chat for your community. Built with ❤️
          </p>
        </div>
      </footer>
    </div>
  )
}
