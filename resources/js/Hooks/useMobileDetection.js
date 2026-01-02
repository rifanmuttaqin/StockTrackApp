import { useState, useEffect } from 'react';

export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [screenSize, setScreenSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setScreenSize({ width, height });

      // Breakpoint definitions
      const mobileBreakpoint = 768; // md breakpoint
      const tabletBreakpoint = 1024; // lg breakpoint

      const newIsMobile = width < mobileBreakpoint;
      const newIsTablet = width >= mobileBreakpoint && width < tabletBreakpoint;
      const newIsDesktop = width >= tabletBreakpoint;

      setIsMobile(newIsMobile);
      setIsTablet(newIsTablet);
      setIsDesktop(newIsDesktop);
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop,
    screenSize,
    isSmallMobile: screenSize.width < 640, // sm breakpoint
    isLargeMobile: screenSize.width >= 640 && screenSize.width < 768,
  };
};
