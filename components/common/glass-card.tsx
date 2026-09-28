import { cn } from "@/lib/utils"

export function GlassCard({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("liquid-glass rounded-3xl", className)} {...props} />
  )
}
