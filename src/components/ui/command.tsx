import * as React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive ref={ref} className={cn('flex h-full w-full flex-col overflow-hidden', className)} {...props} />
))
Command.displayName = CommandPrimitive.displayName

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, value, onValueChange, ...props }, ref) => (
  <div className="flex items-center gap-3 border-b border-black/[0.06] px-4" cmdk-input-wrapper="">
    <Search size={16} className="shrink-0 text-ink-muted" />
    <CommandPrimitive.Input
      ref={ref}
      value={value}
      onValueChange={onValueChange}
      className={cn(
        'flex-1 bg-transparent py-3.5 text-sm text-ink-primary placeholder:text-ink-muted outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
    {/* The cancel-button-cell pattern: a trailing clear control that only
        appears once there's something to clear. Only renders when the
        input is controlled (a value was passed down). */}
    {typeof value === 'string' && value.length > 0 && (
      <button
        type="button"
        onClick={() => onValueChange?.('')}
        aria-label="Clear search"
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-sunken hover:text-ink-primary"
      >
        <X size={12} />
      </button>
    )}
  </div>
))
CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List ref={ref} className={cn('max-h-80 overflow-y-auto overflow-x-hidden p-2', className)} {...props} />
))
CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => <CommandPrimitive.Empty ref={ref} className="px-3 py-6 text-center text-sm text-ink-muted" {...props} />)
CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'overflow-hidden [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2',
      '[&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase',
      '[&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-ink-muted',
      className
    )}
    {...props}
  />
))
CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm outline-none',
      'data-[selected=true]:bg-surface-sunken',
      className
    )}
    {...props}
  />
))
CommandItem.displayName = CommandPrimitive.Item.displayName

export { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem }
