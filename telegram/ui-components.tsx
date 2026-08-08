import React from 'react';

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }>(
  ({ className = '', variant = 'default', size = 'default', children, ...props }, ref) => {
    let baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer ';
    if (variant === 'destructive') baseStyles += 'bg-red-600 text-white hover:bg-red-700 ';
    else if (variant === 'outline') baseStyles += 'border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-100 ';
    else if (variant === 'ghost') baseStyles += 'hover:bg-slate-800 text-slate-100 ';
    else if (variant === 'secondary') baseStyles += 'bg-slate-800 text-slate-100 hover:bg-slate-700 ';
    else baseStyles += 'bg-blue-600 text-white hover:bg-blue-700 ';

    if (size === 'sm') baseStyles += 'h-8 px-3 text-xs ';
    else if (size === 'lg') baseStyles += 'h-11 px-8 text-base ';
    else if (size === 'icon') baseStyles += 'h-9 w-9 p-0 ';
    else baseStyles += 'h-10 px-4 py-2 text-sm ';

    return (
      <button ref={ref} className={`${baseStyles} ${className}`} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export const Card = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 shadow-xl backdrop-blur-md ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-xl font-semibold leading-none tracking-tight text-white ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-sm text-slate-400 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 pt-0 ${className}`} {...props}>
    {children}
  </div>
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', type, ...props }, ref) => (
    <input
      type={type}
      className={`flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Label = ({ className = '', children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={`text-sm font-medium leading-none text-slate-200 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props}>
    {children}
  </label>
);

export const Progress = ({ value = 0, className = '' }: { value?: number; className?: string }) => (
  <div className={`relative h-2 w-full overflow-hidden rounded-full bg-slate-800 ${className}`}>
    <div
      className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    />
  </div>
);

export const Separator = ({ className = '' }: { className?: string }) => (
  <hr className={`my-4 border-slate-800 ${className}`} />
);

export const Switch = ({ checked, onCheckedChange, className = '' }: { checked?: boolean; onCheckedChange?: (checked: boolean) => void; className?: string }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange?.(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-blue-600' : 'bg-slate-700'} ${className}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

export const Slider = ({ value = [0], onValueChange, min = 0, max = 100, step = 1, className = '' }: { value?: number[]; onValueChange?: (val: number[]) => void; min?: number; max?: number; step?: number; className?: string }) => (
  <input
    type="range"
    min={min}
    max={max}
    step={step}
    value={value[0]}
    onChange={(e) => onValueChange?.([parseFloat(e.target.value)])}
    className={`w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 ${className}`}
  />
);

export const Select = ({ children }: { children: React.ReactNode }) => <div className="relative">{children}</div>;
export const SelectTrigger = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => <div className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 cursor-pointer ${className}`}>{children}</div>;
export const SelectValue = ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>;
export const SelectContent = ({ children }: { children: React.ReactNode }) => <div className="mt-1 rounded-md border border-slate-700 bg-slate-900 p-1 shadow-lg text-slate-100">{children}</div>;
export const SelectItem = ({ value, children, onClick }: { value: string; children: React.ReactNode; onClick?: () => void }) => <div onClick={onClick} className="px-3 py-1.5 text-sm rounded cursor-pointer hover:bg-slate-800 text-slate-100">{children}</div>;
