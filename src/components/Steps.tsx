import { Children, createContext, isValidElement, useContext } from 'react'
import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import clsx from 'clsx'

export type StepStatus = 'completed' | 'current' | 'upcoming'

const ActiveStepContext = createContext(0)
const StepItemContext = createContext<{ index: number; status: StepStatus }>({ index: 0, status: 'upcoming' })

/**
 * Steps — an accessible <ol> stepper driven by a single zero-based index.
 * Completed / current / upcoming are all derived from that one value, so
 * they can never disagree with each other.
 *
 *   <Steps activeStep={2} aria-label="Project phase">
 *     {stages.map((s, i) => (
 *       <Steps.Item key={s.id} index={i} label={s.label}>
 *         <Steps.Indicator />
 *         <Steps.Separator />
 *       </Steps.Item>
 *     ))}
 *   </Steps>
 */
export function Steps({
  activeStep,
  children,
  'aria-label': ariaLabel,
}: {
  activeStep: number
  children: ReactNode
  'aria-label'?: string
}) {
  return (
    <ActiveStepContext.Provider value={activeStep}>
      <ol aria-label={ariaLabel} className="flex w-full list-none items-start p-0">
        {children}
      </ol>
    </ActiveStepContext.Provider>
  )
}

function StepsItem({ index, label, children }: { index: number; label: string; children: ReactNode }) {
  const activeStep = useContext(ActiveStepContext)
  const status: StepStatus = index < activeStep ? 'completed' : index === activeStep ? 'current' : 'upcoming'

  // Split children by type rather than position, so <Steps.Indicator/> and
  // <Steps.Separator/> can be composed in either order.
  const kids = Children.toArray(children)
  const separator = kids.find((child) => isValidElement(child) && child.type === StepsSeparator)
  const rest = kids.filter((child) => child !== separator)

  return (
    <StepItemContext.Provider value={{ index, status }}>
      <li
        aria-current={status === 'current' ? 'step' : undefined}
        className="flex flex-1 items-start last:flex-none"
      >
        <div className="flex flex-col items-center">
          {rest}
          <span
            className={clsx(
              'mt-2 whitespace-nowrap text-xs font-medium',
              status === 'current' && 'text-ink-primary',
              status === 'completed' && 'text-ink-secondary',
              status === 'upcoming' && 'text-ink-muted'
            )}
          >
            {label}
          </span>
        </div>
        {separator}
      </li>
    </StepItemContext.Provider>
  )
}

function StepsIndicator() {
  const { index, status } = useContext(StepItemContext)
  return (
    <span
      className={clsx(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
        status === 'completed' && 'bg-brand-500 text-white',
        status === 'current' && 'border-2 border-brand-500 bg-white text-brand-600',
        status === 'upcoming' && 'border border-black/10 bg-surface-sunken text-ink-muted'
      )}
    >
      {status === 'completed' ? <Check size={15} strokeWidth={3} /> : index + 1}
    </span>
  )
}

function StepsSeparator() {
  const { status } = useContext(StepItemContext)
  return (
    <span
      aria-hidden="true"
      className={clsx('mt-4 h-0.5 flex-1 shrink transition-colors', status === 'completed' ? 'bg-brand-500' : 'bg-black/10')}
    />
  )
}

Steps.Item = StepsItem
Steps.Indicator = StepsIndicator
Steps.Separator = StepsSeparator
