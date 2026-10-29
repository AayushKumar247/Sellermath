import { useState } from 'react';

interface MarketplaceLogoProps {
  id: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function MarketplaceLogo({ id, size = 'md', className = '' }: MarketplaceLogoProps) {
  const [imgError, setImgError] = useState(false);

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

  const logoUrl = logoUrls[id] || logoUrls.amazon;

  const brandColors: Record<string, string> = {
    amazon: '#FF9900',
    flipkart: '#2874F0',
    meesho: '#F43397',
    myntra: '#FF3F6C',
    blinkit: '#F8CB46',
    zepto: '#3B006A',
    instamart: '#FC8019',
    snapdeal: '#E40046',
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
    sm: 'w-6 h-6',
    md: 'w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10',
    lg: 'w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12',
  };

  const fontSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const bgColor = brandColors[id] || brandColors.amazon;
  const initial = brandInitials[id] || brandInitials.amazon;

  return (
    <div className={`shrink-0 ${sizeClasses[size]} ${className}`}>
      {!imgError ? (
        <img
          src={logoUrl}
          alt={id}
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
