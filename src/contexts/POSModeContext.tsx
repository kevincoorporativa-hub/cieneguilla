import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useFullscreen } from '@/hooks/useFullscreen';

interface POSModeContextType {
  isKioskMode: boolean;
  isFullscreen: boolean;
  enterKioskMode: () => void;
  exitKioskMode: () => void;
  toggleKioskMode: () => void;
  toggleFullscreen: () => void;
}

const POSModeContext = createContext<POSModeContextType | undefined>(undefined);

export function POSModeProvider({ children }: { children: ReactNode }) {
  const [isKioskMode, setIsKioskMode] = useState(false);
  const { isFullscreen, toggleFullscreen, enterFullscreen, exitFullscreen } = useFullscreen();

  const enterKioskMode = useCallback(() => {
    setIsKioskMode(true);
    enterFullscreen();
  }, [enterFullscreen]);

  const exitKioskMode = useCallback(() => {
    setIsKioskMode(false);
    exitFullscreen();
  }, [exitFullscreen]);

  const toggleKioskMode = useCallback(() => {
    if (isKioskMode) {
      exitKioskMode();
    } else {
      enterKioskMode();
    }
  }, [isKioskMode, enterKioskMode, exitKioskMode]);

  return (
    <POSModeContext.Provider value={{
      isKioskMode,
      isFullscreen,
      enterKioskMode,
      exitKioskMode,
      toggleKioskMode,
      toggleFullscreen,
    }}>
      {children}
    </POSModeContext.Provider>
  );
}

export function usePOSMode() {
  const context = useContext(POSModeContext);
  if (!context) {
    throw new Error('usePOSMode must be used within a POSModeProvider');
  }
  return context;
}
