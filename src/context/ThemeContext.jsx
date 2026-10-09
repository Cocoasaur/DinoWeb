import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

const THEME_KEY = 'dinoweb-theme-v2';
const OLD_THEME_KEY = 'dinoweb-theme';
export const THEME_DEMAIN = 'demain-soir-bleu';
export const THEME_CLAIR = 'clair-obscur';

const CUBE_VARS = ['--cube-color', '--cube-edge-color', '--cube-edge-opacity',
    '--cube-text-default', '--cube-text-hover', '--cube-text-accent',
    '--cube-ticks-idle', '--cube-ticks-hover', '--cube-ticks-hover-scale'];

function readCubePalette(theme) {
    const style = getComputedStyle(document.documentElement);
    return { theme, colors: Object.fromEntries(CUBE_VARS.map(name => [name, style.getPropertyValue(name).trim()])) };
}

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
    const [cubePalette, setCubePalette] = useState(() => readCubePalette(theme));

    const revealCubeTheme = useCallback(() => {
        const current = document.documentElement.getAttribute('data-theme') || THEME_CLAIR;
        setCubePalette(previous => previous.theme === current && !previous.next ? previous : readCubePalette(current));
    }, []);

    useEffect(() => {
        localStorage.setItem(THEME_KEY, theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggle = useCallback(({ deferCube = false } = {}) => {
        const next = theme === THEME_DEMAIN ? THEME_CLAIR : THEME_DEMAIN;
        // Prepare the page's new snapshot immediately. The live cube can keep
        // its old and new palettes while the circle passes across its surface.
        document.documentElement.setAttribute('data-theme', next);
        window.dispatchEvent(new Event('themechange'));
        setTheme(next);
        const palette = readCubePalette(next);
        setCubePalette(previous => deferCube ? { ...previous, next: palette } : palette);
    }, [theme]);

    // isDark preserves backward compatibility for components that check theme brightness
    const isDark = theme === THEME_DEMAIN;

    return (
        <ThemeContext.Provider value={{ theme, isDark, toggle, cubePalette, revealCubeTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
}
