import { useMemo, useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { useCrm } from '@/context/CrmContext'
import type { Lead, Stage } from '@/types'
import { STAGES } from '@/types'
import PipelineColumn from '@/components/PipelineColumn'
import Drawer from '@/components/Drawer'
import LeadDetailPanel from '@/components/LeadDetailPanel'
import { formatCurrency } from '@/lib/format'

export default function PipelinePage() {
  const { leads, updateLeadStage } = useCrm()
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const columns = useMemo(() => {
    const grouped: Record<Stage, Lead[]> = {
      new: [], contacted: [], qualified: [], proposal: [], negotiation: [], won: [], lost: [],
    }
    for (const lead of leads) grouped[lead.stage].push(lead)
    return grouped
  }, [leads])

  const openPipelineValue = STAGES.filter((s) => s !== 'won' && s !== 'lost').reduce(
    (sum, s) => sum + columns[s].reduce((acc, l) => acc + l.value, 0),
    0
  )

  const activeLead = selectedLead ? leads.find((l) => l.id === selectedLead.id) ?? null : null

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const leadId = active.id as string
    const newStage = over.id as Stage
    const lead = leads.find((l) => l.id === leadId)
    if (lead && lead.stage !== newStage) {
      updateLeadStage(leadId, newStage)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">Pipeline</h1>
          <p className="text-sm text-ink-secondary">Drag a card to move a lead between stages</p>
        </div>
        <div className="rounded-lg border border-black/[0.06] bg-white px-4 py-2 text-right shadow-card">
          <p className="text-xs text-ink-muted">Open pipeline value</p>
          <p className="text-lg font-semibold tabular-nums text-ink-primary">{formatCurrency(openPipelineValue)}</p>
        </div>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <PipelineColumn
              key={stage}
              stage={stage}
              leads={columns[stage]}
              onCardClick={(lead) => setSelectedLead(lead)}
            />
          ))}
        </div>
      </DndContext>

      <Drawer open={!!activeLead} onClose={() => setSelectedLead(null)} title="Lead details">
        {activeLead && <LeadDetailPanel lead={activeLead} />}
      </Drawer>
    </div>
  )
}
