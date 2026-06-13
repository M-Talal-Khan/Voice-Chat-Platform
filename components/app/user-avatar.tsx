import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { statusColor, type User } from "@/lib/mock-data"

export function UserAvatar({
  user,
  size = "default",
  showStatus = true,
  className,
}: {
  user: User
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
            "absolute bottom-0 right-0 rounded-full ring-2 ring-card",
            size === "sm" && "size-2",
            size === "default" && "size-2.5",
            size === "lg" && "size-3",
          )}
          style={{ backgroundColor: statusColor(user.status) }}
        />
      )}
    </span>
  )
}
