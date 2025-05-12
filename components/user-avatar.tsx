import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserAvatarProps {
  src?: string | null
  name?: string | null
  className?: string
}

export function UserAvatar({ src, name, className }: UserAvatarProps) {
  // Get initials from name
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "U"

  return (
    <Avatar className={className}>
      <AvatarImage src={src || undefined} alt={name || "User"} />
      <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
    </Avatar>
  )
}
