import { cn } from "@/lib/utils";

const toneClass = {
  green: "border-green-400/30 bg-green-400/[0.12] text-green-200",
  red: "border-red-400/30 bg-red-400/[0.12] text-red-200",
  yellow: "border-yellow-400/30 bg-yellow-400/[0.12] text-yellow-100",
  cyan: "border-cyan-400/30 bg-cyan-400/[0.12] text-cyan-100",
  neutral: "border-white/10 bg-white/[0.08] text-white/70"
};

export function StatusBadge({
  tone = "neutral",
  children,
  className
}: {
  tone?: keyof typeof toneClass;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        toneClass[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
