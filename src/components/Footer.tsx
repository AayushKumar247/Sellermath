import { Calculator } from 'lucide-react';
import { type PageId } from '@/components/Sidebar';

interface FooterProps {
  onNavigate: (page: PageId) => void;
}

const footerLinks: { id: PageId; label: string }[] = [
  { id: 'about', label: 'About Us' },
  { id: 'contact', label: 'Contact Us' },
  { id: 'privacy', label: 'Privacy Policy' },
  { id: 'terms', label: 'Terms & Conditions' },
];

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="no-print bg-slate-900 border-t border-slate-800 mt-12">
      <div className="px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Calculator className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">SellerMath</h2>
                <p className="text-xs text-slate-400 font-medium">India's Most Accurate E-Commerce Profit Engine</p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {footerLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className="text-sm text-slate-400 hover:text-emerald-400 transition-colors font-medium"
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-500 text-center sm:text-left">
              © 2026 SellerMath. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
