import { useRenderProfile } from '../../context/RenderProfileContext';
import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import resumePdf from '../../assets/resume/John_Arquesola_Resume.pdf';
import cvPdf from '../../assets/resume/John_Arquesola_Curriculum_Vitae.pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

const DOCUMENTS = [
    {
        id: 'resume',
        label: 'Résumé',
        url: resumePdf,
        filename: 'John_Arquesola_Resume.pdf',
    },
    {
        id: 'cv',
        label: 'Curriculum Vitae',
        url: cvPdf,
        filename: 'John_Arquesola_Curriculum_Vitae.pdf',
    },
];
const MIN_SCALE = 0.5;
const MAX_SCALE = 2;
const SCALE_STEP = 0.25;

function ZoomButton({ ariaLabel, onClick, disabled, children, className }) {
    return (
        <button
            type="button"
            aria-label={ariaLabel}
            className={`about-cv-toolbar-btn${className ? ` ${className}` : ''}`}
            disabled={disabled}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

function MinusIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}

function DownloadIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
}

export default function CvViewer() {
    const { reduceEffects } = useRenderProfile();
    const [activeDocumentId, setActiveDocumentId] = useState(DOCUMENTS[0].id);
    const [numPages, setNumPages] = useState(null);
    const [scale, setScale] = useState(1);
    const [loadError, setLoadError] = useState(false);

    const activeDocument = DOCUMENTS.find(({ id }) => id === activeDocumentId) || DOCUMENTS[0];

    const zoomIn = () => setScale((s) => Math.min(MAX_SCALE, Math.round((s + SCALE_STEP) * 100) / 100));
    const zoomOut = () => setScale((s) => Math.max(MIN_SCALE, Math.round((s - SCALE_STEP) * 100) / 100));
    const selectDocument = (id) => {
        setActiveDocumentId(id);
        setNumPages(null);
        setLoadError(false);
        setScale(1);
    };

    const handleTabKeyDown = (event) => {
        const currentIndex = DOCUMENTS.findIndex(({ id }) => id === activeDocumentId);
        let nextIndex;

        if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % DOCUMENTS.length;
        else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + DOCUMENTS.length) % DOCUMENTS.length;
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = DOCUMENTS.length - 1;
        else return;

        event.preventDefault();
        const nextDocument = DOCUMENTS[nextIndex];
        selectDocument(nextDocument.id);
        event.currentTarget.querySelector(`#document-tab-${nextDocument.id}`)?.focus();
    };

    return (
        <div className="about-cv-viewer-container border" style={{ borderColor: 'var(--void-border)' }}>
            <div
                className="about-cv-tabs"
                role="tablist"
                aria-label="Document preview"
                onKeyDown={handleTabKeyDown}
            >
                {DOCUMENTS.map((document) => {
                    const isActive = document.id === activeDocument.id;
                    return (
                        <button
                            key={document.id}
                            id={`document-tab-${document.id}`}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-controls="document-preview-panel"
                            tabIndex={isActive ? 0 : -1}
                            className={`about-cv-tab${isActive ? ' about-cv-tab--active' : ''}`}
                            onClick={() => selectDocument(document.id)}
                        >
                            {document.label}
                        </button>
                    );
                })}
            </div>

            {/* Zoom toolbar */}
            <div className="about-cv-toolbar">
                <span className="about-cv-toolbar-label">{activeDocument.label}</span>
                <div className="about-cv-toolbar-actions">
                    <ZoomButton
                        ariaLabel="Zoom out"
                        onClick={zoomOut}
                        disabled={scale <= MIN_SCALE}
                    >
                        <MinusIcon />
                    </ZoomButton>
                    <span className="about-cv-zoom-level" aria-live="polite">
                        {Math.round(scale * 100)}%
                    </span>
                    <ZoomButton
                        ariaLabel="Zoom in"
                        onClick={zoomIn}
                        disabled={scale >= MAX_SCALE}
                    >
                        <PlusIcon />
                    </ZoomButton>
                </div>
            </div>

            {/* Scrollable page column */}
            <div
                id="document-preview-panel"
                className="about-cv-scroll overlay-scroll"
                role="tabpanel"
                aria-labelledby={`document-tab-${activeDocument.id}`}
                aria-busy={numPages === null && !loadError}
            >
                <div className="about-cv-page-stack">
                    <Document
                        key={activeDocument.id}
                        file={activeDocument.url}
                        loading={<p className="about-cv-status" role="status">Loading {activeDocument.label}…</p>}
                        error={<p className="about-cv-status" role="alert">The document preview could not be loaded.</p>}
                        onLoadSuccess={({ numPages: n }) => {
                            setNumPages(n);
                            setLoadError(false);
                        }}
                        onLoadError={() => {
                            setNumPages(0);
                            setLoadError(true);
                        }}
                    >
                        {Array.from({ length: numPages || 0 }, (_, i) => (
                            <div key={`page-${i + 1}`} className="about-cv-page-wrap">
                                <Page
                                    pageNumber={i + 1}
                                    scale={scale}
                                    devicePixelRatio={Math.min(window.devicePixelRatio || 1, reduceEffects ? 1 : 1.5)}
                                    className="about-cv-page"
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                />
                            </div>
                        ))}
                    </Document>
                </div>
            </div>

            {/* Footer */}
            <div className="about-cv-footer">
                <span className="about-cv-filename">{activeDocument.filename}</span>
                <a
                    href={activeDocument.url}
                    download={activeDocument.filename}
                    className="about-cv-download"
                    aria-label={`Download ${activeDocument.label}`}
                >
                    <DownloadIcon />
                    DOWNLOAD {activeDocument.id === 'cv' ? 'CV' : 'RÉSUMÉ'} ↓
                </a>
            </div>
        </div>
    );
}
