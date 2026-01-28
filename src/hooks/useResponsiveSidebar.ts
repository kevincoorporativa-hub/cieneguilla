import { useState, useEffect, useCallback } from 'react';

const COLLAPSE_BREAKPOINT = 1280; // px

interface ResponsiveSidebarState {
  isCollapsed: boolean;
  isFloating: boolean;
  isMobileOpen: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
}

export function useResponsiveSidebar(): ResponsiveSidebarState {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const checkScreenSize = useCallback(() => {
    const width = window.innerWidth;
    const shouldBeFloating = width < COLLAPSE_BREAKPOINT;
    
    setIsFloating(shouldBeFloating);
    
    // Auto-collapse on small screens
    if (shouldBeFloating && !isCollapsed) {
      setIsCollapsed(true);
      setIsMobileOpen(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [checkScreenSize]);

  const toggleSidebar = useCallback(() => {
    if (isFloating) {
      setIsMobileOpen(prev => !prev);
    } else {
      setIsCollapsed(prev => !prev);
    }
  }, [isFloating]);

  const openMobileSidebar = useCallback(() => {
    setIsMobileOpen(true);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  return {
    isCollapsed: isFloating ? true : isCollapsed,
    isFloating,
    isMobileOpen,
    setIsCollapsed,
    toggleSidebar,
    openMobileSidebar,
    closeMobileSidebar,
  };
}
