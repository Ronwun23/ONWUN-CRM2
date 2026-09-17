import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { DollarSign, Percent, Target, Users } from 'lucide-react'
import { useCrm } from '@/context/CrmContext'
import StatCard from '@/components/StatCard'
import ChartCard, { ChartTooltip } from '@/components/ChartCard'
import { OPEN_STAGES, STAGE_LABELS } from '@/types'
import type { Source } from '@/types'
import { monthlyTrend, ownerBreakdown, sourceBreakdown, stageBreakdown, summary } from '@/lib/analytics'
import { formatCurrency, formatFullCurrency } from '@/lib/format'

// Fixed hue per stage (ordinal ramp, light -> dark = new -> negotiation) so color reads as progress.
const STAGE_RAMP: Record<string, string> = {
  new: '#86b6ef',
  contacted: '#6da7ec',
  qualified: '#5598e7',
  proposal: '#3987e5',
  negotiation: '#2a78d6',
}

// Fixed hue per source (entity-based, independent of sort order).
const SOURCE_COLOR: Record<Source, string> = {
  Referral: '#2a78d6',
  Website: '#eb6834',
  'Cold Outreach': '#1baf7a',
  Event: '#eda100',
  Partner: '#e87ba4',
  'Social Media': '#008300',
  'Inbound Call': '#4a3aa7',
}

const GRID_STROKE = '#e1e0d9'
const AXIS_TICK = { fill: '#898781', fontSize: 12 }

export default function AnalyticsPage() {
  const { leads } = useCrm()

  const stats = useMemo(() => summary(leads), [leads])
  const stages = useMemo(() => stageBreakdown(leads), [leads])
  const sources = useMemo(() => sourceBreakdown(leads), [leads])
  const months = useMemo(() => monthlyTrend(leads), [leads])
  const owners = useMemo(() => ownerBreakdown(leads), [leads])

  const funnelData = OPEN_STAGES.map((stage) => {
    const bucket = stages.find((s) => s.stage === stage)!
    return { stage, label: STAGE_LABELS[stage], count: bucket.count, value: bucket.value }
  })

  const won = stages.find((s) => s.stage === 'won')!
  const lost = stages.find((s) => s.stage === 'lost')!
  const winLossData = [
    { label: 'Won', count: won.count, value: won.value, color: '#0ca30c' },
    { label: 'Lost', count: lost.count, value: lost.value, color: '#d03b3b' },
  ]

  const maxOwnerValue = Math.max(...owners.map((o) => o.wonValue), 1)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-primary">Analytics</h1>
        <p className="text-sm text-ink-secondary">Pipeline health and performance across the whole team</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total leads" value={String(stats.totalLeads)} icon={Users} />
        <StatCard
          label="Open pipeline value"
          value={formatCurrency(stats.openValue)}
          delta={`${stats.openCount} open deals`}
          icon={Target}
        />
        <StatCard
          label="Win rate"
          value={`${Math.round(stats.winRate * 100)}%`}
          deltaTone={stats.winRate >= 0.5 ? 'good' : 'bad'}
          delta={stats.winRate >= 0.5 ? 'Above target' : 'Below target'}
          icon={Percent}
        />
        <StatCard label="Avg won deal size" value={formatCurrency(stats.avgDealSize)} icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Pipeline funnel" subtitle="Open leads by stage">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnelData} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid horizontal={false} stroke={GRID_STROKE} />
                <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(11,11,11,0.03)' }}
                  content={
                    <ChartTooltip
                      formatter={(v, name) => (name === 'count' ? `${v} leads` : formatFullCurrency(v))}
                    />
                  }
                />
                <Bar dataKey="count" name="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
                  {funnelData.map((d) => (
                    <Cell key={d.stage} fill={STAGE_RAMP[d.stage]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Won vs. lost" subtitle="Closed deals this period">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={winLossData} margin={{ left: 0, right: 8 }}>
              <CartesianGrid vertical={false} stroke={GRID_STROKE} />
              <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                cursor={{ fill: 'rgba(11,11,11,0.03)' }}
                content={<ChartTooltip formatter={(v) => `${v} deals`} />}
              />
              <Bar dataKey="count" name="count" radius={[4, 4, 0, 0]} maxBarSize={64}>
                {winLossData.map((d) => (
                  <Cell key={d.label} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Leads by source" subtitle="Where leads are coming from">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sources} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid horizontal={false} stroke={GRID_STROKE} />
              <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="source"
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip
                cursor={{ fill: 'rgba(11,11,11,0.03)' }}
                content={<ChartTooltip formatter={(v) => `${v} leads`} />}
              />
              <Bar dataKey="count" name="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {sources.map((d) => (
                  <Cell key={d.source} fill={SOURCE_COLOR[d.source]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="New leads" subtitle="Last 6 months">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={months} margin={{ left: 0, right: 16, top: 8 }}>
              <CartesianGrid vertical={false} stroke={GRID_STROKE} />
              <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v} new leads`} />} />
              <Line
                type="monotone"
                dataKey="newLeads"
                name="New leads"
                stroke="#2a78d6"
                strokeWidth={2}
                dot={{ r: 3, fill: '#2a78d6', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Rep performance" subtitle="Won value and win rate by owner">
        <div className="flex flex-col gap-3">
          {owners.map((owner) => (
            <div key={owner.ownerId} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-sm text-ink-secondary">{owner.name}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(owner.wonValue / maxOwnerValue) * 100}%`,
                    backgroundColor: owner.color,
                  }}
                />
              </div>
              <span className="w-20 shrink-0 text-right text-sm font-medium tabular-nums text-ink-primary">
                {formatCurrency(owner.wonValue)}
              </span>
              <span className="w-16 shrink-0 text-right text-xs tabular-nums text-ink-muted">
                {Math.round(owner.winRate * 100)}% win
              </span>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}
