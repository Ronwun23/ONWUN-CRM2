import { OWNERS } from '@/data/owners'

export function OwnerAvatar({ ownerId, size = 24 }: { ownerId: string; size?: number }) {
  const owner = OWNERS.find((o) => o.id === ownerId)
  if (!owner) return null
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ backgroundColor: owner.color, width: size, height: size, fontSize: size * 0.4 }}
      title={owner.name}
    >
      {owner.initials}
    </div>
  )
}

export function ownerName(ownerId: string): string {
  return OWNERS.find((o) => o.id === ownerId)?.name ?? 'Unassigned'
}
