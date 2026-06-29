import { cn } from '@/lib/utils'
import * as React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  isError?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, error, isError, ...props }, ref) => {
  return (
    <div className="group/input min-w-0 flex-1">
      <div className="relative">
        <span className="pointer-events-none absolute inset-0 rounded-md bg-primary/5 opacity-0 blur-sm transition-all duration-500 ease-out group-focus-within/input:opacity-100" />
        <input
          type={type}
          dir="ltr"
          className={cn(
            'relative z-10 border-border bg-input/90 ring-offset-background file:text-foreground placeholder:text-input-placeholder focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-all duration-300 ease-out file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:transition-all placeholder:duration-300 focus:-translate-y-[1px] focus:bg-background focus:shadow-lg focus:shadow-primary/10 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 group-hover/input:border-primary/30',
            className,
            {
              'border-destructive': !!error || isError,
            },
          )}
          ref={ref}
          {...props}
        />
        <span className="pointer-events-none absolute inset-x-2 -bottom-px z-20 h-px origin-center scale-x-0 rounded-full bg-primary/80 opacity-0 transition-all duration-500 ease-out group-focus-within/input:scale-x-100 group-focus-within/input:opacity-100" />
      </div>
      {error && <span className="text-destructive mt-2 block animate-slide-up text-sm">{error}</span>}
    </div>
  )
})
Input.displayName = 'Input'

export { Input }
