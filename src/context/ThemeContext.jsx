import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

const THEME_KEY = 'dinoweb-theme-v2';
const OLD_THEME_KEY = 'dinoweb-theme';
export const THEME_DEMAIN = 'demain-soir-bleu';
export const THEME_CLAIR = 'clair-obscur';

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        try {
            // Remove legacy key so existing visitors default to Clair Obscur
            localStorage.removeItem(OLD_THEME_KEY);
            const stored = localStorage.getItem(THEME_KEY);
            return stored === THEME_DEMAIN ? THEME_DEMAIN : THEME_CLAIR;
        } catch {
            return THEME_CLAIR;
        }
    });

    useEffect(() => {
        localStorage.setItem(THEME_KEY, theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggle = useCallback(() => {
        const next = theme === THEME_DEMAIN ? THEME_CLAIR : THEME_DEMAIN;
        // Read CSS palettes and update React in the same batch. Sending the
        // new theme with old CSS colors briefly mismatches cube labels/body.
        document.documentElement.setAttribute('data-theme', next);
        window.dispatchEvent(new Event('themechange'));
        setTheme(next);
    }, [theme]);

    // isDark preserves backward compatibility for components that check theme brightness
    const isDark = theme === THEME_DEMAIN;

    return (
        <ThemeContext.Provider value={{ theme, isDark, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
}