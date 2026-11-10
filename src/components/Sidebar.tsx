import { X, FileSpreadsheet, ChevronDown, PenTool, Sparkles, BarChart3, FileText, Rocket } from 'lucide-react';
import React from 'react';

export type PageId =
  | 'home'
  | 'calculator'
  | 'roas'
  | 'shipping'
  | 'listing-writer'
  | 'seo-keywords'
  | 'listing-optimizer'
  | 'image-resizer'
  | 'bulk-csv'
  | 'bg-remover'
  | 'image-generator'
  | 'settlement-reconciliation'
  | 'rto-analytics'
  | 'gst-invoice'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'terms';

interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  status?: 'active' | 'coming-soon' | 'new';
  onClick?: () => void;
}

interface NavGroup {
  id: string;
  label: string;
  icon?: React.ElementType;
  items?: DropdownItem[];
  isDropdown?: boolean;
  directId?: PageId;
}

const navGroups: NavGroup[] = [
  { id: 'home', label: 'Home', directId: 'home' },
  {
    id: 'calculators', label: 'Calculators', icon: Rocket, isDropdown: true,
    items: [
      { id: 'calculator', label: 'Product Profit Calculator', status: 'active' },
      { id: 'roas', label: 'ROAS & Break-Even Calculator', status: 'active' },
      { id: 'shipping', label: 'Shipping & RTO Calculator', status: 'active' },
    ],
  },
  {
    id: 'ai-studio', label: 'AI Studio', icon: Sparkles, isDropdown: true,
    items: [
      { id: 'listing-writer', label: 'AI Product Listing Writer', status: 'active' },
      { id: 'seo-keywords', label: 'SEO Keyword Generator', status: 'active' },
      { id: 'listing-optimizer', label: 'Marketplace Listing Optimizer', status: 'active' },
    ],
  },
  {
    id: 'product-studio', label: 'Product Studio', icon: PenTool, isDropdown: true,
    items: [
      { id: 'image-resizer', label: 'Product Image Resizer', status: 'active' },
      { id: 'bg-remover', label: 'AI Background Remover', status: 'active' },
      { id: 'image-generator', label: 'AI Image & Lifestyle Studio', status: 'active' },
    ],
  },
  {
    id: 'csv-intelligence', label: 'CSV Intelligence', icon: FileSpreadsheet, isDropdown: true,
    items: [
      { id: 'bulk-csv', label: 'Bulk CSV Profit Calculator', status: 'new' },
      { id: 'settlement-reconciliation', label: 'Settlement Reconciliation', status: 'active' },
      { id: 'rto-analytics', label: 'Returns & RTO Analytics', status: 'active' },
    ],
  },
  { id: 'gst-invoice', label: 'GST Invoice', directId: 'gst-invoice', icon: FileText },
  {
    id: 'learn', label: 'Learn', icon: BarChart3, isDropdown: true,
    items: [
      { id: 'ecom-guides', label: 'E-Commerce Guides', status: 'coming-soon' },
      { id: 'marketplace-guides', label: 'Marketplace Selling Guides', status: 'coming-soon' },
      { id: 'seller-tutorials', label: 'Seller Tutorials', status: 'coming-soon' },
    ],
  },
];

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export default function Sidebar({ activePage, onNavigate, isOpen, onClose, className = '' }: SidebarProps) {
  const [openDropdownId, setOpenDropdownId] = React.useState<string | null>(null);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 dark:bg-zinc-900/60 bg-slate-900/60 backdrop-blur-sm z-30 xl:hidden" onClick={onClose} />
      )}

      <aside className={`fixed top-0 left-0 z-40 h-full w-72 dark:bg-[#0c0c0f] bg-white flex flex-col transform transition-transform duration-300 ease-in-out xl:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${className}`}>
        <div className="flex items-center justify-between px-6 h-20 border-b dark:border-zinc-800/80 border-slate-200">
          <div className="flex items-center gap-3">
            <img src="/sellermath-logo.png" alt="SellerMath" className="w-10 h-10 rounded-xl overflow-hidden object-cover drop-shadow-md shrink-0" />
            <div>
              <h1 className="text-xl font-bold dark:text-zinc-50 text-slate-900 tracking-tight">SellerMath</h1>
              <p className="text-xs dark:text-zinc-300 text-slate-500 font-medium">Profit Intelligence</p>
            </div>
          </div>
          <button onClick={onClose} className="xl:hidden dark:text-zinc-300 text-slate-400 dark:hover:text-zinc-50 hover:text-slate-600 transition-colors select-none focus:outline-none focus:ring-0">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-3 mb-3 text-xs font-semibold dark:text-zinc-300 text-slate-500 uppercase tracking-wider">Tools</p>
          {navGroups.map((group) => {
            if (!group.isDropdown && group.directId) {
              const directId = group.directId;
              const isActive = activePage === directId;
              return (
                <button key={group.id} onClick={() => onNavigate(directId)} className={`w-full flex items-center justify-start gap-3 px-3.5 py-2.5 text-left rounded-xl text-sm font-medium transition-all duration-200 group select-none focus:outline-none focus:ring-0 ${isActive ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-300 shadow-sm' : 'dark:text-zinc-300 text-slate-600 dark:hover:text-zinc-50 hover:text-slate-900 dark:hover:bg-zinc-800/60 hover:bg-slate-50'}`}>
                  {group.icon ? (
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${group.id === 'gst-invoice' ? 'bg-emerald-500/10 dark:bg-emerald-500/20' : 'dark:bg-zinc-800 bg-zinc-100'}`}>
                      <group.icon className={`w-4 h-4 ${group.id === 'gst-invoice' ? 'text-emerald-600 dark:text-emerald-400' : 'dark:text-zinc-400 text-zinc-600'}`} strokeWidth={2.5} />
                    </div>
                  ) : null}
                  <span className="whitespace-nowrap flex-1">{group.label}</span>
                  {group.label === 'Bulk CSV Profit Calculator' && (<span className="ml-auto px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500 text-white animate-pulse">NEW</span>)}
                  {isActive && (<span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />)}
                </button>
              );
            }

            const isActive = (group.items ?? []).some((item) => item.status === 'active' && activePage === item.id);
            const dropdownOpen = openDropdownId === group.id;

            return (
              <div key={group.id} className="space-y-0.5">
                <button onClick={() => setOpenDropdownId(openDropdownId === group.id ? null : group.id)} className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left rounded-xl text-sm font-medium transition-all duration-200 group select-none focus:outline-none focus:ring-0 ${isActive ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-300 shadow-sm' : 'dark:text-zinc-300 text-slate-600 dark:hover:text-zinc-50 hover:text-slate-900 dark:hover:bg-zinc-800/60 hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                    {group.icon ? (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 dark:bg-zinc-800 bg-zinc-100">
                        <group.icon className="w-4 h-4 dark:text-zinc-400 text-zinc-600" strokeWidth={2.5} />
                      </div>
                    ) : null}
                    <span className="whitespace-nowrap flex-1">{group.label}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="ml-2 space-y-0.5 border-l-2 border-l-emerald-500/30 pl-3">
                    {(group.items ?? []).map((item) => {
                      const isDisabled = item.status === 'coming-soon';
                      const isItemActive = activePage === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={!isDisabled && item.status === 'active' ? () => onNavigate(item.id as PageId) : undefined}
                          className={`flex items-center gap-3 px-3 py-2 text-left rounded-xl text-sm transition-colors ${isDisabled ? 'opacity-60 cursor-not-allowed dark:text-zinc-500 text-zinc-400' : isItemActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'dark:text-zinc-300 text-zinc-600 dark:hover:bg-zinc-800/60 hover:bg-zinc-100'}`}
                        >
                          {item.icon ? (
                            <div className="w-5 h-5 rounded flex items-center justify-center shrink-0"><item.icon className="w-3 h-3 dark:text-zinc-400 text-zinc-500" strokeWidth={2} /></div>
                          ) : null}
                          <span className="whitespace-nowrap flex-1">{item.label}</span>
                          {item.status === 'new' && (<span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500 text-white animate-pulse">NEW</span>)}
                          {item.status === 'coming-soon' && (<span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full dark:bg-zinc-800 bg-zinc-200 dark:border-zinc-700 border-zinc-300 dark:text-zinc-400 text-zinc-500">Soon</span>)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="p-4 border-t dark:border-zinc-800/80 border-slate-200">
          <div className="rounded-xl dark:bg-zinc-900/50 bg-slate-50 p-4">
            <p className="text-xs dark:text-zinc-300 text-slate-600 leading-relaxed"><span className="text-emerald-600 dark:text-emerald-400 font-semibold">Pro Tip:</span> Factor in a 15-20% return rate for apparel categories on Meesho to get realistic blended profit estimates.</p>
          </div>
        </div>
      </aside>
    </>
  );
}