import { cn } from "@/lib/utils";

/**
 * Grey placeholder block. Pulses gently; the pulse is off under reduced motion.
 * Decorative: the surrounding skeleton wrapper announces "Loading…" once.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-espresso/[0.08] motion-reduce:animate-none", className)}
      {...props}
    />
  );
}

export { Skeleton };
