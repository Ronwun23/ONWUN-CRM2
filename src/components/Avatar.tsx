import { resolveMember } from '@/data/team'

export function MemberAvatar({ memberId, size = 24 }: { memberId: string; size?: number }) {
  if (!memberId) return null
  const member = resolveMember(memberId)
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ backgroundColor: member.color, width: size, height: size, fontSize: size * 0.4 }}
      title={member.name}
    >
      {member.initials}
    </div>
  )
}

export function memberName(memberId: string): string {
  return memberId ? resolveMember(memberId).name : 'Unassigned'
}

export function ClientAvatar({
  initials,
  color,
  size = 36,
}: {
  initials: string
  color: string
  size?: number
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl font-bold text-white"
      style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  )
}
