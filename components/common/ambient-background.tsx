export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -top-1/4 -left-1/4 size-3/4 animate-drift rounded-full bg-radial from-orange-600/25 to-transparent to-70% blur-3xl motion-reduce:animate-none" />
      <div className="absolute top-1/3 -right-1/4 size-2/3 animate-drift rounded-full bg-radial from-red-700/20 to-transparent to-70% blur-3xl [animation-delay:-8s] motion-reduce:animate-none" />
      <div className="absolute -bottom-1/3 left-1/4 size-2/3 animate-drift rounded-full bg-radial from-amber-500/15 to-transparent to-70% blur-3xl [animation-delay:-16s] motion-reduce:animate-none" />
    </div>
  )
}
