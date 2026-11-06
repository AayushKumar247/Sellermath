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
        className="absolute right-0 top-full mt-2 w-72 dark:bg-zinc-900/90 bg-white/90 backdrop-blur-xl dark:border-zinc-800/80 border-zinc-200/80 shadow-2xl dark:shadow-black/80 shadow-lg rounded-2xl overflow-hidden z-50"
      >
        <div className="px-4 py-3 border-b dark:border-zinc-800/60 border-zinc-200/60 dark:bg-zinc-950/50 bg-zinc-50/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold dark:text-zinc-50 text-zinc-900">SellerMath Community</p>
              <p className="text-xs dark:text-zinc-400 text-zinc-500">Free Tier Member</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400">
              FREE TIER
            </span>
          </div>
        </div>

        <div className="py-1.5">
          <button
            onClick={handleShare}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium dark:text-zinc-300 text-zinc-700 dark:hover:bg-zinc-800/60 hover:bg-zinc-100 transition-colors select-none focus:outline-none focus:ring-0"
          >
            <Share2 className="w-4 h-4 dark:text-zinc-400 text-zinc-500" />
            Share Tool
          </button>

          <button
            onClick={handleContact}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium dark:text-zinc-300 text-zinc-700 dark:hover:bg-zinc-800/60 hover:bg-zinc-100 transition-colors select-none focus:outline-none focus:ring-0"
          >
            <LifeBuoy className="w-4 h-4 dark:text-zinc-400 text-zinc-500" />
            Contact Support &amp; Feedback
          </button>

          <button
            onClick={() => {
              onNavigate('bulk-csv');
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium dark:text-zinc-300 text-zinc-700 dark:hover:bg-zinc-800/60 hover:bg-zinc-100 transition-colors border-t dark:border-zinc-800/60 border-zinc-200/60 select-none focus:outline-none focus:ring-0"
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
