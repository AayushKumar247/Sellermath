import { useState } from 'react';

interface MarketplaceLogoProps {
  id?: string;
  marketplace?: string;
  platform?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export default function MarketplaceLogo({ id, marketplace, platform, name, size = 'md', className = '' }: MarketplaceLogoProps) {
  const [imgError, setImgError] = useState(false);

  const rawKey = (marketplace || platform || id || name || '').toLowerCase().trim();

  const normalizeKey = (key: string): string => {
    if (key.includes('flipkart')) return 'flipkart';
    if (key.includes('meesho')) return 'meesho';
    if (key.includes('myntra')) return 'myntra';
    if (key.includes('blinkit')) return 'blinkit';
    if (key.includes('zepto')) return 'zepto';
    if (key.includes('instamart') || key.includes('swiggy')) return 'instamart';
    if (key.includes('snapdeal')) return 'snapdeal';
    if (key.includes('amazon')) return 'amazon';
    return 'amazon';
  };

  const logoId = normalizeKey(rawKey);

  const logoUrls: Record<string, string> = {
    amazon: 'https://www.google.com/s2/favicons?domain=amazon.in&sz=128',
    flipkart: 'https://www.google.com/s2/favicons?domain=flipkart.com&sz=128',
    meesho: 'https://www.google.com/s2/favicons?domain=meesho.com&sz=128',
    myntra: 'https://www.google.com/s2/favicons?domain=myntra.com&sz=128',
    blinkit: 'https://www.google.com/s2/favicons?domain=blinkit.com&sz=128',
    zepto: 'https://www.google.com/s2/favicons?domain=zeptonow.com&sz=128',
    instamart: 'https://www.google.com/s2/favicons?domain=swiggy.com&sz=128',
    snapdeal: 'https://www.google.com/s2/favicons?domain=snapdeal.com&sz=128',
  };

  const logoUrl = logoUrls[logoId] || logoUrls.amazon;

  const brandColors: Record<string, string> = {
    amazon: '#FB923C',
    flipkart: '#3B82F6',
    meesho: '#C026D3',
    myntra: '#F472B6',
    blinkit: '#FACC15',
    zepto: '#7C3AED',
    instamart: '#F97316',
    snapdeal: '#EF4444',
  };

  const brandInitials: Record<string, string> = {
    amazon: 'A',
    flipkart: 'F',
    meesho: 'M',
    myntra: 'M',
    blinkit: 'B',
    zepto: 'Z',
    instamart: 'I',
    snapdeal: 'S',
  };

  const sizeClasses = {
    xs: 'w-5 h-5',
    sm: 'w-6 h-6',
    md: 'w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10',
    lg: 'w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12',
  };

  const fontSizes = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const bgColor = brandColors[logoId] || brandColors.amazon;
  const initial = brandInitials[logoId] || brandInitials.amazon;

  return (
    <div className={`shrink-0 ${sizeClasses[size]} ${className}`}>
      {!imgError ? (
        <img
          src={logoUrl}
          alt={logoId}
          className="w-full h-full object-contain rounded-2xl shadow-sm"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={`w-full h-full rounded-2xl flex items-center justify-center font-bold text-white shadow-sm ${fontSizes[size]}`}
          style={{ backgroundColor: bgColor }}
        >
          {initial}
        </div>
      )}
    </div>
  );
}
