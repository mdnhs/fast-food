"use client"

import { useState, useSyncExternalStore } from "react"
import { Clock, Flame, MapPin, Send } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  BRAND_NAME,
  MODEL_CREDIT,
  NAV_LINKS,
  STORE_ADDRESS,
  STORE_HOURS,
  STORE_MAP_URL,
  STORE_TIME_ZONE,
} from "@/lib/site"
import { cn } from "@/lib/utils"

const storeClock = new Intl.DateTimeFormat("en-US", {
  timeZone: STORE_TIME_ZONE,
  weekday: "long",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
})

function isStoreOpen() {
  const parts = Object.fromEntries(
    storeClock.formatToParts(new Date()).map((part) => [part.type, part.value])
  )
  const today = STORE_HOURS.find((entry) => entry.day === parts.weekday)
  if (!today) return false
  const hour = Number(parts.hour) + Number(parts.minute) / 60
  return hour >= today.open && hour < today.close
}

function subscribeToMinutes(onChange: () => void) {
  const id = window.setInterval(onChange, 60_000)
  return () => window.clearInterval(id)
}

function formatHour(hour: number) {
  if (hour === 0 || hour === 24) return "12am"
  if (hour === 12) return "12pm"
  return hour > 12 ? `${hour - 12}pm` : `${hour}am`
}

function OpenBadge() {
  // Server render has no reliable "now", so the badge only appears after hydration.
  const open = useSyncExternalStore(subscribeToMinutes, isStoreOpen, () => null)
  if (open === null) return <span className="h-7" />

  return (
    <span
      className={cn(
        "inline-flex h-7 w-fit items-center gap-2 rounded-full px-3 text-xs font-semibold",
        open ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-2 rounded-full",
          open ? "animate-pulse bg-green-400" : "bg-red-400"
        )}
      />
      {open ? "Open now" : "Closed now"}
    </span>
  )
}

function NewsletterForm() {
  const [subscribed, setSubscribed] = useState(false)

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        setSubscribed(true)
      }}
      className="flex flex-col gap-3"
    >
      <label
        htmlFor="newsletter-email"
        className="font-heading text-lg font-bold"
      >
        Get secret menu drops
      </label>
      <p className="text-sm text-muted-foreground">
        One email a month. New burgers first, no spam.
      </p>
      <div className="flex gap-2">
        <input
          id="newsletter-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          disabled={subscribed}
          className="h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-black/20 px-4 text-sm inset-shadow-sm inset-shadow-black/40 outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={subscribed}
          className={cn(
            buttonVariants({ variant: "glow" }),
            "h-11 rounded-full px-5"
          )}
        >
          <Send aria-hidden />
          Join
        </button>
      </div>
      <p role="status" className="min-h-5 text-sm text-green-400">
        {subscribed && "You're on the list. See you at the grill."}
      </p>
    </form>
  )
}

export function Footer() {
  return (
    <footer id="visit" className="relative px-4 pt-20 pb-6">
      <div className="liquid-glass mx-auto max-w-7xl rounded-4xl p-8 sm:p-12">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-4">
            <a
              href="#top"
              className="flex items-center gap-2 font-heading text-xl font-bold"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Flame className="size-4" aria-hidden />
              </span>
              {BRAND_NAME}
            </a>
            <p className="text-sm text-muted-foreground">
              Flame-grilled artisanal burgers, made to order since 2019.
            </p>
            <nav aria-label="Footer">
              <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-primary"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
              <Clock className="size-4 text-primary" aria-hidden />
              Store hours
            </h2>
            <OpenBadge />
            <dl className="grid grid-cols-2 gap-y-1 text-sm">
              {STORE_HOURS.map((entry) => (
                <div key={entry.day} className="contents">
                  <dt className="text-muted-foreground">{entry.day}</dt>
                  <dd className="text-right">
                    {formatHour(entry.open)} – {formatHour(entry.close)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
              <MapPin className="size-4 text-primary" aria-hidden />
              Find us
            </h2>
            <address className="text-sm text-muted-foreground not-italic">
              {STORE_ADDRESS}
            </address>
            <a
              href={STORE_MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-glass inline-flex h-10 w-fit items-center rounded-full px-4 text-sm font-medium transition-colors hover:bg-white/10"
            >
              Open in Maps
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>

          <NewsletterForm />
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
          </p>
          <p>
            3D model
            <a
              href={MODEL_CREDIT.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-primary"
            >
              “{MODEL_CREDIT.title}”
            </a>
            by {MODEL_CREDIT.author}, licensed under
            <a
              href={MODEL_CREDIT.licenseUrl}
              target="_blank"
              rel="noopener noreferrer license"
              className="underline underline-offset-2 hover:text-primary"
            >
              CC BY 4.0
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
