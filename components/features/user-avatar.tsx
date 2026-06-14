import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export type AvatarUser = {
  id: string
  username: string
  initials: string
  color: string
  status: "online" | "idle" | "dnd" | "offline"
  avatar?: string
  customStatus?: string
}

function statusColor(status: string): string {
  switch (status) {
    case "online":
      return "var(--color-online)"
    case "idle":
      return "var(--color-idle)"
    case "dnd":
      return "var(--color-dnd)"
    default:
      return "var(--color-offline)"
  }
}

export function UserAvatar({
  user,
  size = "default",
  showStatus = true,
  className,
}: {
  user: AvatarUser
  size?: "default" | "sm" | "lg"
  showStatus?: boolean
  className?: string
}) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <Avatar size={size}>
        {user.avatar && <AvatarImage src={user.avatar} alt={user.username} />}
        <AvatarFallback
          style={{ backgroundColor: user.color }}
          className="font-medium text-primary-foreground"
        >
          {user.initials}
        </AvatarFallback>
      </Avatar>
      {showStatus && (
        <span
          aria-label={user.status}
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-bg-secondary",
            size === "sm" && "size-2 shadow-[0_0_6px_currentColor]",
            size === "default" && "size-2.5 shadow-[0_0_6px_currentColor]",
            size === "lg" && "size-3 shadow-[0_0_8px_currentColor]",
          )}
          style={{ backgroundColor: statusColor(user.status), color: statusColor(user.status) }}
        />
      )}
    </span>
  )
}
