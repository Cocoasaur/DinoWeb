import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '../context/ThemeContext';
import AppErrorBoundary from '../components/ui/AppErrorBoundary';
import { loadDeferredStyles } from '../utils/deferredLoad';
import SplinePrototype from './SplinePrototype';

export function mountPortfolio() {
    loadDeferredStyles();
    createRoot(document.getElementById('root')).render(
        <StrictMode>
            <AppErrorBoundary>
                <ThemeProvider><SplinePrototype /></ThemeProvider>
            </AppErrorBoundary>
        </StrictMode>,
    );
}
