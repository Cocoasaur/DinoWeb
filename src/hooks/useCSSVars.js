import { useState, useEffect, useRef, useCallback } from 'react';

export function useCSSVars(varNames) {
    const varNamesRef = useRef(varNames);

    const [values, setValues] = useState(() => {
        const root = getComputedStyle(document.documentElement);
        const initial = {};
        varNamesRef.current.forEach(name => {
            initial[name] = root.getPropertyValue(name).trim();
        });
        return initial;
    });

    const valuesRef = useRef(values);
    valuesRef.current = values;

    const readVars = useCallback(() => {
        const root = getComputedStyle(document.documentElement);
        const next = {};
        let changed = false;
        varNamesRef.current.forEach(name => {
            const val = root.getPropertyValue(name).trim();
            next[name] = val;
            if (val !== valuesRef.current[name]) changed = true;
        });
        if (changed) setValues(next);
    }, []);

    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.type === 'attributes' && m.attributeName === 'data-theme') {
                    requestAnimationFrame(readVars);
                    break;
                }
            }
        });
        observer.observe(document.documentElement, { attributes: true });
        window.addEventListener('themechange', readVars);
        return () => {
            observer.disconnect();
            window.removeEventListener('themechange', readVars);
        };
    }, [readVars]);

    return values;
}