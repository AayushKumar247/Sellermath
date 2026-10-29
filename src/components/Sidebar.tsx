import { Calculator, Store, Truck, Sparkles, ShoppingBag, Target, FileText, Globe, X } from 'lucide-react';
import MarketplaceLogo from './MarketplaceLogo';

export type PageId = 'meesho' | 'flipkart' | 'blinkit' | 'ai-listing' | 'amazon-fba' | 'roas' | 'gst-invoice' | 'universal' | 'about' | 'contact' | 'privacy' | 'terms';

interface NavItem {
  id: PageId;
  label: string;
  icon?: React.ElementType;
  logoId?: string;
}

const navItems: NavItem[] = [
  { id: 'universal', label: 'Universal Profit Calculator', icon: Globe },
  { id: 'meesho', label: 'Meesho Calculator', logoId: 'meesho' },
  { id: 'flipkart', label: 'Flipkart Calculator', logoId: 'flipkart' },
  { id: 'blinkit', label: 'Blinkit Margin', logoId: 'blinkit' },
  { id: 'amazon-fba', label: 'Amazon FBA Calculator', logoId: 'amazon' },
  { id: 'roas', label: 'ROAS / Break-Even Tool', icon: Target },
  { id: 'gst-invoice', label: 'GST Invoice Generator', icon: FileText },
  { id: 'ai-listing', label: 'AI Listing Writer', icon: Sparkles },
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
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-72 bg-slate-900 flex flex-col
          transform transition-transform duration-300 ease-in-out lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between px-6 h-20 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Calculator className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">SellerMath</h1>
              <p className="text-xs text-slate-400 font-medium">Profit Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tools
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
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
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-300 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }
                `}
              >
                {item.logoId ? (
                  <MarketplaceLogo id={item.logoId} size="sm" />
                ) : (
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-emerald-400' : ''
                    }`}
                    strokeWidth={2}
                  />
                )}
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="rounded-xl bg-slate-800/50 p-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              <span className="text-emerald-400 font-semibold">Pro Tip:</span> Factor in a
              15-20% return rate for apparel categories on Meesho to get realistic blended
              profit estimates.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
