import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search as SearchIcon, X } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import Card from '@/components/Card'
import Pill from '@/components/Pill'
import { Select } from '@/components/ui/select'
import { fetchAcquisitionUsage, findCompanies, type CompanyResult } from '@/lib/api/findCompanies'

const inputClass =
  'w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

export default function AcquisitionFindCompanies() {
  const { acquisitionProfile, addLead, activeAccount } = useApp()
  const countries = useMemo(
    () => (acquisitionProfile?.countries ?? '').split(',').map((c) => c.trim()).filter(Boolean),
    [acquisitionProfile?.countries]
  )
  const [country, setCountry] = useState('')
  const [results, setResults] = useState<CompanyResult[]>([])
  const [notes, setNotes] = useState<Record<number, string>>({})
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [addingIndex, setAddingIndex] = useState<number | null>(null)
  const [tokensUsed, setTokensUsed] = useState<number | null>(null)
  const [budget, setBudget] = useState<number | null>(null)

  useEffect(() => {
    fetchAcquisitionUsage()
      .then((usage) => {
        setTokensUsed(usage.tokensUsed)
        setBudget(usage.budget)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!country && countries.length > 0) setCountry(countries[0])
  }, [country, countries])

  const budgetReached = budget !== null && tokensUsed !== null && tokensUsed >= budget

  const handleSearch = async () => {
    if (!country) return
    setSearching(true)
    setSearchError(null)
    try {
      const result = await findCompanies(country)
      setResults(result.companies)
      setNotes({})
      setTokensUsed(result.tokensUsed)
      setBudget(result.budget)
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed.')
    } finally {
      setSearching(false)
    }
  }

  const handleRemove = (index: number) => {
    setResults((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAdd = async (index: number) => {
    const company = results[index]
    setAddingIndex(index)
    try {
      await addLead({
        companyName: company.companyName,
        website: company.website,
        contactEmail: company.contactEmail,
        country,
        whyFits: company.platform ? `Platform: ${company.platform}. ${company.whyFits}` : company.whyFits,
        noticedNote: notes[index]?.trim() || undefined,
        owner: activeAccount.id,
      })
      handleRemove(index)
    } finally {
      setAddingIndex(null)
    }
  }

  if (!acquisitionProfile) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">Find companies</h1>
        </div>
        <Card>
          <p className="text-sm text-ink-muted">
            <Link to="/acquisition/setup" className="text-brand-600 underline">
              Fill in Setup
            </Link>{' '}
            first — the search needs your niche and countries.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">Find companies</h1>
        </div>
        {tokensUsed !== null && (
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Tokens this month</p>
            <p className="text-sm font-semibold text-ink-primary">
              {tokensUsed.toLocaleString()}
              {budget !== null && <span className="text-ink-muted"> / {budget.toLocaleString()}</span>}
            </p>
          </div>
        )}
      </div>

      <Card>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Country</label>
            <Select value={country} onChange={setCountry} options={countries.map((c) => ({ value: c, label: c }))} />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !country || budgetReached}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SearchIcon size={14} />
            {searching ? 'Searching…' : 'Search'}
          </button>
        </div>
        {budgetReached && (
          <p className="mt-2 text-xs text-status-critical">Monthly AI token budget reached — try again next month.</p>
        )}
        {searchError && <p className="mt-2 text-xs text-status-critical">{searchError}</p>}
      </Card>

      {results.length > 0 && (
        <div className="flex flex-col gap-3">
          {results.map((company, index) => (
            <Card key={`${company.website}-${index}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink-primary">{company.companyName}</p>
                    {company.platform && <Pill tone="brand">{company.platform}</Pill>}
                  </div>
                  <a
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-600 hover:text-brand-700"
                  >
                    {company.website}
                  </a>
                  {company.contactEmail && <p className="mt-0.5 text-xs text-ink-secondary">{company.contactEmail}</p>}
                  <p className="mt-2 text-sm text-ink-secondary">{company.whyFits}</p>
                  <div className="mt-3">
                    <input
                      value={notes[index] ?? ''}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [index]: e.target.value }))}
                      placeholder="What you noticed — a genuine observation about their brand or website"
                      className={inputClass}
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleAdd(index)}
                      disabled={addingIndex === index}
                      className="rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {addingIndex === index ? 'Adding…' : 'Add to contacts'}
                    </button>
                    <button
                      onClick={() => handleRemove(index)}
                      className="flex items-center gap-1 rounded-lg border border-black/[0.10] px-3.5 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-sunken"
                    >
                      <X size={13} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
