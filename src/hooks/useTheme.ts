import { useState, useEffect } from 'react';
import { ThemeColor } from '@/types/pos';

export const themeColors: Record<ThemeColor, {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  ring: string;
  sidebarPrimary: string;
}> = {
  orange: {
    name: 'Naranja (Pizzería)',
    primary: '24 95% 53%',
    secondary: '215 25% 27%',
    accent: '38 92% 50%',
    ring: '24 95% 53%',
    sidebarPrimary: '24 95% 53%',
  },
  blue: {
    name: 'Azul (Profesional)',
    primary: '217 91% 60%',
    secondary: '215 25% 27%',
    accent: '199 89% 48%',
    ring: '217 91% 60%',
    sidebarPrimary: '217 91% 60%',
  },
  green: {
    name: 'Verde (Natural)',
    primary: '142 76% 36%',
    secondary: '160 84% 39%',
    accent: '158 64% 52%',
    ring: '142 76% 36%',
    sidebarPrimary: '142 76% 36%',
  },
  purple: {
    name: 'Púrpura (Elegante)',
    primary: '271 81% 56%',
    secondary: '280 65% 35%',
    accent: '262 83% 58%',
    ring: '271 81% 56%',
    sidebarPrimary: '271 81% 56%',
  },
  red: {
    name: 'Rojo (Restaurante)',
    primary: '0 84% 60%',
    secondary: '0 74% 42%',
    accent: '25 95% 53%',
    ring: '0 84% 60%',
    sidebarPrimary: '0 84% 60%',
  },
  teal: {
    name: 'Teal (Moderno)',
    primary: '174 84% 35%',
    secondary: '186 100% 28%',
    accent: '168 80% 40%',
    ring: '174 84% 35%',
    sidebarPrimary: '174 84% 35%',
  },
};

// Colores de sidebar disponibles
export const sidebarColors: Record<string, {
  name: string;
  background: string;
  foreground: string;
  accent: string;
  border: string;
}> = {
  dark: {
    name: 'Oscuro (Predeterminado)',
    background: '220 20% 14%',
    foreground: '220 10% 90%',
    accent: '220 20% 20%',
    border: '220 15% 25%',
  },
  darker: {
    name: 'Negro Profundo',
    background: '0 0% 8%',
    foreground: '0 0% 95%',
    accent: '0 0% 15%',
    border: '0 0% 20%',
  },
  navy: {
    name: 'Azul Marino',
    background: '222 47% 11%',
    foreground: '210 40% 98%',
    accent: '217 33% 17%',
    border: '215 25% 27%',
  },
  slate: {
    name: 'Gris Pizarra',
    background: '215 28% 17%',
    foreground: '210 40% 96%',
    accent: '215 25% 25%',
    border: '215 20% 30%',
  },
  charcoal: {
    name: 'Carbón',
    background: '210 11% 15%',
    foreground: '210 20% 90%',
    accent: '210 11% 22%',
    border: '210 11% 28%',
  },
  wine: {
    name: 'Vino Tinto',
    background: '340 25% 15%',
    foreground: '340 15% 92%',
    accent: '340 25% 22%',
    border: '340 20% 28%',
  },
  forest: {
    name: 'Verde Bosque',
    background: '150 25% 12%',
    foreground: '150 15% 92%',
    accent: '150 25% 18%',
    border: '150 20% 25%',
  },
};

// Función para convertir HEX a HSL
export function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Función para convertir HSL a HEX
export function hslToHex(hsl: string): string {
  const parts = hsl.match(/(\d+)\s+(\d+)%?\s+(\d+)%?/);
  if (!parts) return '#000000';
  
  const h = parseInt(parts[1]) / 360;
  const s = parseInt(parts[2]) / 100;
  const l = parseInt(parts[3]) / 100;
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<ThemeColor | 'custom'>(() => {
    const saved = localStorage.getItem('pos-theme');
    return (saved as ThemeColor | 'custom') || 'orange';
  });

  const [customPrimaryColor, setCustomPrimaryColor] = useState<string>(() => {
    const saved = localStorage.getItem('pos-custom-primary');
    return saved || '#f97316'; // default orange
  });

  const [currentSidebarColor, setCurrentSidebarColor] = useState<string>(() => {
    const saved = localStorage.getItem('pos-sidebar-color');
    return saved || 'dark';
  });

  const [customSidebarColor, setCustomSidebarColor] = useState<string>(() => {
    const saved = localStorage.getItem('pos-custom-sidebar');
    return saved || '#1a1a2e';
  });

  useEffect(() => {
    if (currentTheme === 'custom') {
      applyCustomTheme(customPrimaryColor);
    } else {
      applyTheme(currentTheme);
    }
    localStorage.setItem('pos-theme', currentTheme);
  }, [currentTheme, customPrimaryColor]);

  useEffect(() => {
    localStorage.setItem('pos-custom-primary', customPrimaryColor);
  }, [customPrimaryColor]);

  useEffect(() => {
    if (currentSidebarColor === 'custom') {
      applyCustomSidebarColor(customSidebarColor);
    } else {
      applySidebarColor(currentSidebarColor);
    }
    localStorage.setItem('pos-sidebar-color', currentSidebarColor);
  }, [currentSidebarColor, customSidebarColor]);

  useEffect(() => {
    localStorage.setItem('pos-custom-sidebar', customSidebarColor);
  }, [customSidebarColor]);

  const applyTheme = (theme: ThemeColor) => {
    const colors = themeColors[theme];
    const root = document.documentElement;
    
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--ring', colors.ring);
    root.style.setProperty('--sidebar-primary', colors.sidebarPrimary);
    root.style.setProperty('--accent', colors.accent);
  };

  const applyCustomTheme = (hexColor: string) => {
    const hslColor = hexToHsl(hexColor);
    const root = document.documentElement;
    
    root.style.setProperty('--primary', hslColor);
    root.style.setProperty('--ring', hslColor);
    root.style.setProperty('--sidebar-primary', hslColor);
    root.style.setProperty('--accent', hslColor);
  };

  const applySidebarColor = (colorId: string) => {
    const colors = sidebarColors[colorId];
    if (!colors) return;
    
    const root = document.documentElement;
    root.style.setProperty('--sidebar-background', colors.background);
    root.style.setProperty('--sidebar-foreground', colors.foreground);
    root.style.setProperty('--sidebar-accent', colors.accent);
    root.style.setProperty('--sidebar-border', colors.border);
  };

  const applyCustomSidebarColor = (hexColor: string) => {
    const hslBg = hexToHsl(hexColor);
    const root = document.documentElement;
    
    // Calculate lighter/darker versions for accent and border
    const parts = hslBg.match(/(\d+)\s+(\d+)%?\s+(\d+)%?/);
    if (!parts) return;
    
    const h = parts[1];
    const s = parseInt(parts[2]);
    const l = parseInt(parts[3]);
    
    const accentL = Math.min(l + 8, 100);
    const borderL = Math.min(l + 15, 100);
    const foregroundL = l < 50 ? 92 : 10;
    
    root.style.setProperty('--sidebar-background', hslBg);
    root.style.setProperty('--sidebar-foreground', `${h} ${Math.max(s - 10, 0)}% ${foregroundL}%`);
    root.style.setProperty('--sidebar-accent', `${h} ${s}% ${accentL}%`);
    root.style.setProperty('--sidebar-border', `${h} ${Math.max(s - 5, 0)}% ${borderL}%`);
  };

  const setCustomPrimary = (hexColor: string) => {
    setCustomPrimaryColor(hexColor);
    setCurrentTheme('custom');
    applyCustomTheme(hexColor);
  };

  const setCustomSidebar = (hexColor: string) => {
    setCustomSidebarColor(hexColor);
    setCurrentSidebarColor('custom');
    applyCustomSidebarColor(hexColor);
  };

  return {
    currentTheme,
    setTheme: setCurrentTheme,
    themes: themeColors,
    currentSidebarColor,
    setSidebarColor: setCurrentSidebarColor,
    sidebarColors,
    // Custom color support
    customPrimaryColor,
    setCustomPrimary,
    customSidebarColor,
    setCustomSidebar,
  };
}
