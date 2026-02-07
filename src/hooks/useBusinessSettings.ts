import { useState, useEffect, useCallback } from 'react';

export interface BusinessSettings {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessRuc: string;
  systemLogoUrl: string;
  ticketLogoUrl: string;
  ticketPromoText: string;
  ticketFooterText: string;
}

const STORAGE_KEY = 'pizzapos-business-settings';

const defaultSettings: BusinessSettings = {
  businessName: 'PizzaPOS',
  businessAddress: 'Av. Principal 123, Lima',
  businessPhone: '01-234-5678',
  businessRuc: '20123456789',
  systemLogoUrl: '',
  ticketLogoUrl: '',
  ticketPromoText: '¡Pide 2 pizzas y llévate una gaseosa gratis!',
  ticketFooterText: '¡Gracias por su preferencia!',
};

function loadSettings(): BusinessSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch {
    // ignore
  }
  return defaultSettings;
}

// Simple event emitter for cross-component sync
const listeners = new Set<() => void>();
function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export function useBusinessSettings() {
  const [settings, setSettingsState] = useState<BusinessSettings>(loadSettings);

  // Subscribe to changes from other components
  useEffect(() => {
    const handler = () => {
      setSettingsState(loadSettings());
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const updateSettings = useCallback((partial: Partial<BusinessSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      // Notify other instances
      setTimeout(notifyListeners, 0);
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
