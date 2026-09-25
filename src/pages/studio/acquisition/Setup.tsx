import Card from '@/components/Card'

export default function AcquisitionSetup() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ink-primary">Setup</h1>
        <p className="text-sm text-ink-secondary">The brief that drives who you target</p>
      </div>
      <Card>
        <p className="text-sm text-ink-muted">
          Coming in Phase 2 — the niche, countries, and pitch details that power AI-drafted outreach emails. Leads can
          already be added and worked manually from Contacts.
        </p>
      </Card>
    </div>
  )
}
