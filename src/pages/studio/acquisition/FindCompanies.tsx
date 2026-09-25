import Card from '@/components/Card'

export default function AcquisitionFindCompanies() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ink-primary">Find companies</h1>
        <p className="text-sm text-ink-secondary">AI-powered search for companies matching your brief</p>
      </div>
      <Card>
        <p className="text-sm text-ink-muted">
          Coming in Phase 3, once Setup is filled in — an AI search per country with a monthly token budget meter.
          Leads can already be added and worked manually from Contacts.
        </p>
      </Card>
    </div>
  )
}
