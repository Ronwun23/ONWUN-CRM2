import { ClientAvatar } from '@/components/Avatar'
import type { Client } from '@/types'

/**
 * A compact, horizontally-overlapping avatar group (MUI AvatarGroup).
 * Stacking order is just the given array order — deterministic, never
 * re-shuffled on re-render. Each avatar gets a ring matching the surrounding
 * surface color so overlapping circles stay visually separated, and any
 * clients past `max` collapse into a single "+N" overflow avatar.
 */
export default function ClientAvatarStack({
  clients,
  max = 4,
  size = 30,
  ringClassName = 'ring-black',
}: {
  clients: Client[]
  max?: number
  size?: number
  ringClassName?: string
}) {
  const visible = clients.slice(0, max)
  const overflow = clients.length - visible.length
  const overlap = Math.round(size * 0.4)

  return (
    <div className="flex flex-row items-center justify-center">
      {visible.map((c, i) => (
        <div
          key={c.id}
          className={`rounded-full ring-[3px] ${ringClassName}`}
          style={{ marginLeft: i === 0 ? 0 : -overlap, zIndex: visible.length - i }}
        >
          <ClientAvatar initials={c.initials} color={c.color} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={`flex shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-white/70 ring-[3px] ${ringClassName}`}
          style={{ width: size, height: size, marginLeft: -overlap, zIndex: 0 }}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}
