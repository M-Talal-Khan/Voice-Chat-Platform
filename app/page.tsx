import Link from "next/link"
import {
  Mic,
  MessageSquare,
  Users,
  Shield,
  Headphones,
  Zap,
  Radio,
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
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Radio className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">Resonate</span>
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
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-[var(--color-online)]" />
              Voice &amp; text chat for every community
            </div>
            <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
              Where your community{" "}
              <span className="text-primary">comes to talk</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Resonate brings your people together with high-quality voice rooms,
              organized text channels, and the tools to run a thriving community.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/app">
                  <Users className="size-4" data-icon="inline-start" />
                  Join a Server
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
            <div className="mx-auto mt-16 max-w-4xl">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
                  <span className="size-3 rounded-full bg-[var(--color-dnd)]" />
                  <span className="size-3 rounded-full bg-[var(--color-idle)]" />
                  <span className="size-3 rounded-full bg-[var(--color-online)]" />
                </div>
                <div className="flex h-72 text-left">
                  <div className="hidden w-14 flex-col items-center gap-3 bg-rail py-4 sm:flex">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">
                      RH
                    </span>
                    <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-xs text-secondary-foreground">
                      DG
                    </span>
                    <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-xs text-secondary-foreground">
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
                    <span className="px-2 py-1 text-sm text-muted-foreground">
                      # dev-talk
                    </span>
                    <span className="px-2 py-1 text-sm text-muted-foreground">
                      # design
                    </span>
                    <p className="mt-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Voice Channels
                    </p>
                    <span className="flex items-center gap-1.5 px-2 py-1 text-sm text-muted-foreground">
                      <Mic className="size-3.5" /> Lobby
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
                    <div className="mt-auto flex items-center gap-2 rounded-lg bg-background/40 px-3 py-2 text-sm text-muted-foreground">
                      Message #general
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-border/60 bg-card/30">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Everything your community needs
              </h2>
              <p className="mt-4 text-pretty text-muted-foreground">
                From late-night gaming sessions to focused work sprints, Resonate
                has the channels and controls to keep everyone in sync.
              </p>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
                >
                  <span className="flex size-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
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
        <section id="voice" className="border-t border-border/60">
          <div className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6">
            <Headphones className="mx-auto size-10 text-primary" />
            <h2 className="mt-6 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to start talking?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-pretty text-muted-foreground">
              Create your first server in seconds. No downloads, no friction —
              just your community and a place to gather.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">Get started free</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/app">Explore the app</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="communities" className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Radio className="size-4" />
            </span>
            <span className="text-sm font-medium">Resonate</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built as a UI demo. Voice and data wiring coming soon.
          </p>
        </div>
      </footer>
    </div>
  )
}
