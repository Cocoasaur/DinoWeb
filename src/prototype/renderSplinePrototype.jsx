import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '../context/ThemeContext';
import AppErrorBoundary from '../components/ui/AppErrorBoundary';
import { recoverImportFailure } from '../utils/loadRecovery';
import { loadDeferredStyles } from '../utils/deferredLoad';
import SplinePrototype from './SplinePrototype';

export function mountPortfolio() {
    void loadDeferredStyles().catch(recoverImportFailure);
    createRoot(document.getElementById('root')).render(
        <StrictMode>
            <AppErrorBoundary>
                <ThemeProvider><SplinePrototype /></ThemeProvider>
            </AppErrorBoundary>
        </StrictMode>,
    );
}
