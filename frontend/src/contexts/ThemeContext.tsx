import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeSkin = 'midnight' | 'emerald' | 'ocean' | 'slate' | 'gold' | 'light' | 'system' | 'cyberpunk' | 'nordic' | 'velvet' | 'forest' | 'snow' | 'solar' | 'rose' | 'mint' | 'sky' | 'sand';

interface ThemeContextType {
  skin: ThemeSkin;
  setSkin: (skin: ThemeSkin) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [skin, setSkinState] = useState<ThemeSkin>(() => {
    const saved = localStorage.getItem('finanças_skin');
    return (saved as ThemeSkin) || 'midnight';
  });

  const setSkin = (newSkin: ThemeSkin) => {
    setSkinState(newSkin);
    localStorage.setItem('finanças_skin', newSkin);
  };

  useEffect(() => {
    const html = document.documentElement;
    
    // Determine which skin to apply
    let skinToApply: string = skin;
    if (skin === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      skinToApply = isDark ? 'midnight' : 'light';
    }

    // Update color-scheme at root
    html.style.colorScheme = (skinToApply === 'light') ? 'light' : 'dark';
    
    // Remove all existing skin classes
    const allSkins = ['skin-midnight', 'skin-emerald', 'skin-ocean', 'skin-slate', 'skin-gold', 'skin-light', 'skin-cyberpunk', 'skin-nordic', 'skin-velvet', 'skin-forest', 'skin-snow', 'skin-solar', 'skin-rose', 'skin-mint', 'skin-sky', 'skin-sand'];
    html.classList.remove(...allSkins);
    
    // Add new skin class
    html.classList.add(`skin-${skinToApply}`);
    
    // Update active skin meta tag for browsers
    const colors: Record<string, string> = {
      midnight: '#09090b',
      emerald: '#022c22',
      ocean: '#082f49',
      slate: '#0f172a',
      gold: '#1c1917',
      light: '#ffffff',
      cyberpunk: '#050505',
      nordic: '#2e3440',
      velvet: '#000000',
      forest: '#06100c',
      snow: '#f8fafc',
      solar: '#fdf6e3',
      rose: '#fff1f2',
      mint: '#f0fdf4',
      sky: '#f0f9ff',
      sand: '#fafaf9'
    };
    
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', colors[skinToApply] || colors.midnight);
    }

    // Listen for system theme changes if in system mode
    if (skin === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const isDark = mediaQuery.matches;
        html.style.colorScheme = isDark ? 'dark' : 'light';
        html.classList.remove(...allSkins);
        html.classList.add(isDark ? 'skin-midnight' : 'skin-light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [skin]);

  return (
    <ThemeContext.Provider value={{ skin, setSkin }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
