import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import Card from '@/components/Card'
import { MemberAvatar, memberName } from '@/components/Avatar'
import { todayCivil } from '@/lib/civilDate'
import { formatDueDate } from '@/lib/format'
import { SEQUENCE_STEP_LABEL } from '@/lib/leadOutcomes'
import type { Lead, SequenceStep } from '@/types'

interface DueItem {
  lead: Lead
  step: SequenceStep
}

export default function AcquisitionToday() {
  const { leads, markLeadDoneSentIt } = useApp()
  const [workingOn, setWorkingOn] = useState<string | null>(null)

  const today = todayCivil()
  const due: DueItem[] = leads
    .flatMap((lead) => lead.steps.filter((step) => !step.done && step.dueDate <= today).map((step) => ({ lead, step })))
    .sort((a, b) => memberName(a.lead.owner).localeCompare(memberName(b.lead.owner)) || a.step.dueDate.localeCompare(b.step.dueDate))

  const handleDone = async (leadId: string) => {
    setWorkingOn(leadId)
    try {
      await markLeadDoneSentIt(leadId)
    } finally {
      setWorkingOn(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ink-primary">Today</h1>
        <p className="text-sm text-ink-secondary">Everything due today or overdue, across both of you</p>
      </div>

      <Card padded={false}>
        {due.length === 0 ? (
          <p className="p-4 text-sm text-ink-muted">Nothing due — you're caught up.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-black/[0.05] px-4">
            {due.map(({ lead, step }) => {
              const dueLabel = formatDueDate(step.dueDate)
              return (
                <li key={step.id} className="flex items-center gap-3 py-3">
                  <MemberAvatar memberId={lead.owner} size={26} />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/acquisition/contacts/${lead.id}`}
                      className="truncate text-sm font-medium text-ink-primary hover:text-brand-600"
                    >
                      {lead.companyName}
                    </Link>
                    <p className="truncate text-xs text-ink-muted">{SEQUENCE_STEP_LABEL[step.stepType]}</p>
                  </div>
                  <span
                    className={
                      dueLabel.overdue ? 'text-xs font-medium text-status-critical' : 'text-xs font-medium text-ink-muted'
                    }
                  >
                    {dueLabel.label}
                  </span>
                  <button
                    onClick={() => handleDone(lead.id)}
                    disabled={workingOn === lead.id}
                    className="flex items-center gap-1 rounded-lg border border-black/[0.10] px-2.5 py-1.5 text-xs font-semibold text-ink-primary hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Check size={12} />
                    Done
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
