import { Quote, Star } from "lucide-react"

import { cn } from "@/lib/utils"

type Review = { name: string; handle: string; quote: string }

const REVIEWS: Review[] = [
  {
    name: "Maya R.",
    handle: "@mayaeats",
    quote:
      "The smoked cheddar Wagyu ruined every other burger for me. Worth every cent.",
  },
  {
    name: "Jonah K.",
    handle: "@jonahgrills",
    quote: "Arrived in 15 minutes and the bun was still crisp. How?!",
  },
  {
    name: "Priya S.",
    handle: "@priyaplates",
    quote:
      "Inferno Stack is actually spicy, not marketing spicy. I'm obsessed.",
  },
  {
    name: "Leo M.",
    handle: "@leo.munches",
    quote:
      "Garden Smash is the first plant burger my meat-loving dad asked for again.",
  },
  {
    name: "Ava T.",
    handle: "@avatastes",
    quote: "That glaze. I would drink that glaze.",
  },
  {
    name: "Sam D.",
    handle: "@samdoesfood",
    quote: "Best fries-and-shake combo in the city, full stop.",
  },
]

const CRITIC_QUOTES = [
  { quote: "A masterclass in restraint and fire.", source: "City Food Weekly" },
  {
    quote: "The most satisfying burger delivery we've tested.",
    source: "The Late Plate",
  },
  {
    quote: "Brioche, Wagyu, char: executed flawlessly.",
    source: "Grill & Grain Journal",
  },
]

function Stars({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="5 out of 5 stars"
      className={cn("inline-flex gap-0.5", className)}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden
          className="size-4 fill-primary text-primary"
        />
      ))}
    </span>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <figure className="liquid-glass flex w-80 shrink-0 flex-col gap-4 rounded-3xl p-6">
      <Stars />
      <blockquote className="flex-1 text-pretty">
        &ldquo;{review.quote}&rdquo;
      </blockquote>
      <figcaption className="flex items-center gap-3 text-sm">
        <span
          aria-hidden
          className="flex size-9 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary"
        >
          {review.name[0]}
        </span>
        <span className="flex flex-col">
          <span className="font-medium">{review.name}</span>
          <span className="text-muted-foreground">{review.handle}</span>
        </span>
      </figcaption>
    </figure>
  )
}

function MarqueeRow({
  reviews,
  reverse = false,
}: {
  reviews: Review[]
  reverse?: boolean
}) {
  return (
    <div className="group flex overflow-hidden mask-x-from-90% mask-x-to-100% motion-reduce:overflow-x-auto">
      {/* The list is rendered twice so each copy sliding by its own width loops seamlessly; the copy is hidden from assistive tech. */}
      {[false, true].map((isCopy) => (
        <ul
          key={String(isCopy)}
          aria-hidden={isCopy || undefined}
          className={cn(
            "flex shrink-0 gap-6 pr-6 group-hover:[animation-play-state:paused] motion-reduce:animate-none",
            reverse ? "animate-marquee-reverse" : "animate-marquee",
            isCopy && "motion-reduce:hidden"
          )}
        >
          {reviews.map((review) => (
            <li key={review.handle}>
              <ReviewCard review={review} />
            </li>
          ))}
        </ul>
      ))}
    </div>
  )
}

export function Testimonials() {
  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="relative flex flex-col gap-12 px-4 py-24 md:py-32"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-4 md:max-w-xl">
          <p className="text-sm font-semibold tracking-widest text-primary uppercase">
            Customer buzz
          </p>
          <h2
            id="reviews-heading"
            className="font-heading text-4xl font-extrabold tracking-tight text-balance sm:text-5xl"
          >
            Loved loudly, reviewed honestly.
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-heading text-6xl font-extrabold text-primary">
            4.9
          </span>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <Stars />
            <span>from 12,400+ reviews</span>
          </div>
        </div>
      </div>

      <div className="-mx-4 flex flex-col gap-6">
        <MarqueeRow reviews={REVIEWS} />
        <MarqueeRow reviews={[...REVIEWS].reverse()} reverse />
      </div>

      <ul className="mx-auto grid w-full max-w-7xl gap-6 md:grid-cols-3">
        {CRITIC_QUOTES.map((critic) => (
          <li key={critic.source}>
            <figure className="flex h-full flex-col gap-3 border-l-2 border-primary pl-5">
              <Quote aria-hidden className="size-5 text-primary" />
              <blockquote className="font-heading text-xl font-semibold text-balance">
                {critic.quote}
              </blockquote>
              <figcaption className="text-sm text-muted-foreground">
                — {critic.source}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  )
}
