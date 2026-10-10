import { useState, useEffect, useRef } from 'react';
import { Share2, LifeBuoy, Sparkles, Check } from 'lucide-react';
import { type PageId } from '@/components/Sidebar';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: PageId) => void;
}

export function ProfileDropdown({ isOpen, onClose, onNavigate }: ProfileDropdownProps) {
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!isOpen) return null;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      // Fallback for browsers without clipboard API
      setCopied(true);
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
        className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-40"
      >
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">SellerMath Community</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Free Tier Member</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
              FREE TIER
            </span>
          </div>
        </div>

        <div className="py-1.5">
          <button
            onClick={handleShare}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <Share2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            {copied ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Link Copied!
              </span>
            ) : (
              'Share Tool'
            )}
          </button>

          <button
            onClick={handleContact}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <LifeBuoy className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            Contact Support &amp; Feedback
          </button>
        </div>

        <div className="px-3 pb-3">
          <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 border border-slate-700 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 bg-emerald-500" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-white">Get Pro Insights</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated bulk SKU calculations coming soon
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
