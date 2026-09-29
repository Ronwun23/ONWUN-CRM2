import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import Card from '@/components/Card'

const inputClass =
  'w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted'

export default function AcquisitionSetup() {
  const { acquisitionProfile, saveAcquisitionProfile } = useApp()
  const [niche, setNiche] = useState(acquisitionProfile?.niche ?? '')
  const [countries, setCountries] = useState(acquisitionProfile?.countries ?? '')
  const [whoExactly, setWhoExactly] = useState(acquisitionProfile?.whoExactly ?? '')
  const [whatWeSell, setWhatWeSell] = useState(acquisitionProfile?.whatWeSell ?? '')
  const [price, setPrice] = useState(acquisitionProfile?.price ?? '')
  const [callDays, setCallDays] = useState(acquisitionProfile?.callDays ?? '')
  const [pastWorkWhat, setPastWorkWhat] = useState(acquisitionProfile?.pastWorkWhat ?? '')
  const [pastWorkWhy, setPastWorkWhy] = useState(acquisitionProfile?.pastWorkWhy ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!niche.trim() || !countries.trim()) return
    setSaving(true)
    try {
      await saveAcquisitionProfile({
        niche: niche.trim(),
        countries: countries.trim(),
        whoExactly: whoExactly.trim() || undefined,
        whatWeSell: whatWeSell.trim() || undefined,
        price: price.trim() || undefined,
        callDays: callDays.trim() || undefined,
        pastWorkWhat: pastWorkWhat.trim() || undefined,
        pastWorkWhy: pastWorkWhy.trim() || undefined,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ink-primary">Setup</h1>
      </div>

      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Niche</label>
            <input
              required
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. independent skincare and beauty brands"
              className={inputClass}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={labelClass}>Countries</label>
            <input
              required
              value={countries}
              onChange={(e) => setCountries(e.target.value)}
              placeholder="e.g. UK, Ireland, Australia"
              className={inputClass}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={labelClass}>Who exactly</label>
            <textarea
              value={whoExactly}
              onChange={(e) => setWhoExactly(e.target.value)}
              rows={4}
              placeholder="Written like a brief to a sales setter: size, what they sell, who to."
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>What we sell</label>
              <input
                value={whatWeSell}
                onChange={(e) => setWhatWeSell(e.target.value)}
                className={inputClass}
                autoComplete="off"
              />
            </div>
            <div>
              <label className={labelClass}>Price</label>
              <input value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} autoComplete="off" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Days we take calls</label>
            <input
              value={callDays}
              onChange={(e) => setCallDays(e.target.value)}
              placeholder="e.g. Tuesdays and Thursdays"
              className={inputClass}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={labelClass}>
              Past work in this niche <span className="normal-case text-ink-muted/70">(optional)</span>
            </label>
            <p className="mb-2 text-xs text-ink-muted">
              It sharpens the pack and the first lines the tool writes from your notes. Leave it empty and the pack is
              just as good.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <textarea
                value={pastWorkWhat}
                onChange={(e) => setPastWorkWhat(e.target.value)}
                rows={3}
                placeholder="What did you do for them"
                className={inputClass}
              />
              <textarea
                value={pastWorkWhy}
                onChange={(e) => setPastWorkWhy(e.target.value)}
                rows={3}
                placeholder="Why was it valuable to them"
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!niche.trim() || !countries.trim() || saving}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            {saved && <span className="text-sm font-medium text-brand-600">Saved.</span>}
          </div>
        </div>
      </Card>
    </div>
  )
}
