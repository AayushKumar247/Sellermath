import { X } from 'lucide-react';

export type PageId = 'ai-listing' | 'roas' | 'gst-invoice' | 'universal' | 'about' | 'contact' | 'privacy' | 'terms';

interface NavItem {
  id: PageId;
  label: string;
  imageSrc: string;
}

const navItems: NavItem[] = [
  { id: 'universal', label: 'Universal Profit Calculator', imageSrc: '/universal-logo.png' },
  { id: 'roas', label: 'ROAS / Break-Even Tool', imageSrc: '/roas-logo.png' },
  { id: 'gst-invoice', label: 'GST Invoice Generator', imageSrc: '/gst-logo.png' },
  { id: 'ai-listing', label: 'AI Listing Writer', imageSrc: '/ai-writer-logo.png' },
];

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activePage, onNavigate, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 dark:bg-zinc-900/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-72 bg-white dark:bg-[#0c0c0f] flex flex-col
          transform transition-transform duration-300 ease-in-out lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between px-6 h-20 border-b border-slate-200 dark:border-zinc-800/80">
          <div className="flex items-center gap-3">
            <img
              src="/sellermath-logo.png"
              alt="SellerMath"
              className="w-10 h-10 rounded-xl overflow-hidden object-cover drop-shadow-md shrink-0"
            />
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">SellerMath</h1>
              <p className="text-xs text-slate-500 dark:text-zinc-300 font-medium">Profit Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 dark:text-zinc-300 hover:text-slate-600 dark:hover:text-zinc-50 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 mb-3 text-xs font-semibold text-slate-500 dark:text-zinc-300 uppercase tracking-wider">
            Tools
          </p>
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium
                  transition-all duration-200 group
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-300 shadow-sm'
                      : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-50 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                  }
                `}
              >
                <img
                  src={item.imageSrc}
                  alt={item.label}
                  className="w-7 h-7 rounded-full overflow-hidden object-cover drop-shadow-sm shrink-0"
                />
                <span className="whitespace-nowrap truncate">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-zinc-800/80">
          <div className="rounded-xl bg-slate-50 dark:bg-zinc-900/50 p-4">
            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Pro Tip:</span> Factor in a
              15-20% return rate for apparel categories on Meesho to get realistic blended
              profit estimates.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
