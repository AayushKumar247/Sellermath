import { useRef } from 'react';
import { Share2, LifeBuoy, FileSpreadsheet } from 'lucide-react';
import { type PageId } from '@/components/Sidebar';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: PageId) => void;
}

export function ProfileDropdown({ isOpen, onClose, onNavigate }: ProfileDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SellerMath AI',
          text: 'Check out this e-commerce profit and ROAS calculator!',
          url: window.location.href
        });
      } catch (err) {
        console.log('Share canceled or failed.', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleContact = () => {
    onNavigate('contact');
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div
        ref={ref}
        className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-800 overflow-hidden z-40"
      >
        <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-zinc-50">SellerMath Community</p>
              <p className="text-xs text-slate-400 dark:text-zinc-300">Free Tier Member</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
              FREE TIER
            </span>
          </div>
        </div>

        <div className="py-1.5">
          <button
            onClick={handleShare}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <Share2 className="w-4 h-4 text-slate-400 dark:text-zinc-300" />
            Share Tool
          </button>

          <button
            onClick={handleContact}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <LifeBuoy className="w-4 h-4 text-slate-400 dark:text-zinc-300" />
            Contact Support &amp; Feedback
          </button>

          <button
            onClick={() => {
              onNavigate('bulk-csv');
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors border-t border-slate-100 dark:border-zinc-800"
          >
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-2.5 h-2.5 text-white" />
            </div>
            Bulk SKU Calculator
          </button>
        </div>

        
      </div>
    </>
  );
}
