import { ReactNode } from 'react';

interface InputCardProps {
  label: string;
  hint: string;
  icon: React.ElementType;
  prefix?: string;
  suffix?: string;
  value: number;
  onChange: (raw: string) => void;
  placeholder?: string;
}

export function InputCard({
  label,
  hint,
  icon: Icon,
  prefix,
  suffix,
  value,
  onChange,
  placeholder = '0',
}: InputCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 transition-all duration-200 hover:shadow-lg hover:border-slate-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-slate-600" strokeWidth={2} />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 block">{label}</label>
            <p className="text-xs text-slate-400">{hint}</p>
          </div>
        </div>
      </div>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type="number"
          inputMode="decimal"
          value={value === 0 ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full text-lg font-semibold text-slate-900 bg-slate-50 rounded-xl border-2 border-slate-200 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:bg-white ${
            prefix ? 'pl-9' : 'pl-4'
          } ${suffix ? 'pr-9' : 'pr-4'} py-3`}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  subtitle: string;
  icon: React.ElementType;
  variant: 'positive' | 'negative' | 'neutral';
  isLoss?: boolean;
}

export function MetricCard({ label, value, subtitle, icon: Icon, variant, isLoss }: MetricCardProps) {
  const isPositive = isLoss ? false : value >= 0;

  const bgClass =
    variant === 'positive'
      ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'
      : variant === 'negative'
      ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
      : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200';

  const iconBg = variant === 'positive' ? 'bg-emerald-500' : variant === 'negative' ? 'bg-red-500' : 'bg-slate-500';
  const valueColor = isPositive ? 'text-emerald-600' : 'text-red-600';

  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 border-2 transition-all duration-300 ${bgClass}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} shadow-lg`}>
            <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-slate-600">{label}</span>
        </div>
      </div>
      <p className={`text-3xl font-bold tracking-tight ${valueColor}`}>
        {variant === 'neutral' ? '' : isLoss ? '-' : ''}
        ₹{Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
    </div>
  );
}

interface HeroCardProps {
  title: string;
  subtitle: string;
  value: number;
  badge: string;
  icon: React.ElementType;
  children?: ReactNode;
}

export function HeroCard({ title, subtitle, value, badge, icon: Icon, children }: HeroCardProps) {
  const isProfit = value >= 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-8 border-2 transition-all duration-300 ${
        isProfit
          ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700'
          : 'bg-gradient-to-br from-slate-900 to-red-950 border-red-900'
      }`}
    >
      <div
        className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 ${
          isProfit ? 'bg-emerald-500' : 'bg-red-500'
        }`}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xl ${
                isProfit ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            >
              <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="text-sm text-slate-400">{subtitle}</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700">
            <span className="text-sm font-bold text-slate-200">{badge}</span>
          </div>
        </div>
        <div className="flex items-end gap-3">
          <p
            className={`text-5xl sm:text-6xl font-bold tracking-tight ${
              isProfit ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {value < 0 ? '-' : ''}₹
            {Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span
            className={`text-sm font-semibold mb-2 px-3 py-1 rounded-full ${
              isProfit ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
            }`}
          >
            {isProfit ? 'NET PROFITABLE' : 'NET LOSS'}
          </span>
        </div>
        {children && <div className="mt-6 pt-6 border-t border-slate-700/50">{children}</div>}
      </div>
    </div>
  );
}

interface InfoBannerProps {
  children: ReactNode;
}

export function InfoBanner({ children }: InfoBannerProps) {
  return (
    <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-start gap-2.5 border border-slate-200">
      <span className="text-slate-400 flex-shrink-0 mt-0.5 text-sm font-bold">i</span>
      <p className="text-xs text-slate-500 leading-relaxed">{children}</p>
    </div>
  );
}
