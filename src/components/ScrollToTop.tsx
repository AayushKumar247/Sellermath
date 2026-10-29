import { useEffect } from 'react';

interface ScrollToTopProps {
  trigger: any;
}

export default function ScrollToTop({ trigger }: ScrollToTopProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [trigger]);

  return null;
}
