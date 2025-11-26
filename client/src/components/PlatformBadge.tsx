import { Trophy } from "lucide-react";

interface PlatformBadgeProps {
  platform?: string;
  size?: "sm" | "md" | "lg";
}

export function PlatformBadge({ platform = "KOZZII", size = "md" }: PlatformBadgeProps) {
  if (platform !== "KOSCOCO") return null;

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div
      className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-medium"
      title="KOSCOCO Competition Video"
      data-testid="badge-koscoco"
    >
      <Trophy className={sizeClasses[size]} />
      <span>KOSCOCO</span>
    </div>
  );
}
