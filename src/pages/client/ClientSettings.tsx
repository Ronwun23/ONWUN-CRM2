import { useClientOutlet } from '@/lib/useClient'
import Card from '@/components/Card'
import ClientForm from '@/components/ClientForm'

export default function ClientSettings() {
  const client = useClientOutlet()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ink-primary">Client settings</h1>
      </div>

      <Card className="max-w-lg">
        <ClientForm existing={client} onDone={() => {}} />
      </Card>
    </div>
  )
}
