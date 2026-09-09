import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import resumePdf from '../../assets/resume/Arquesola_Curriculum_Vitae.pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

const CV_PDF_URL = resumePdf;
const CV_FILENAME = 'Arquesola_Curriculum_Vitae.pdf';
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
    const [numPages, setNumPages] = useState(null);
    const [scale, setScale] = useState(1);

    const zoomIn = () => setScale((s) => Math.min(MAX_SCALE, Math.round((s + SCALE_STEP) * 100) / 100));
    const zoomOut = () => setScale((s) => Math.max(MIN_SCALE, Math.round((s - SCALE_STEP) * 100) / 100));

    return (
        <div className="about-cv-viewer-container border" style={{ borderColor: 'var(--void-border)' }}>
            {/* Zoom toolbar */}
            <div className="about-cv-toolbar">
                <span className="about-cv-toolbar-label">VIEWER</span>
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
            <div className="about-cv-scroll overlay-scroll">
                <div className="about-cv-page-stack">
                    <Document
                        file={CV_PDF_URL}
                        onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                    >
                        {Array.from({ length: numPages || 0 }, (_, i) => (
                            <div key={`page-${i + 1}`} className="about-cv-page-wrap">
                                <Page
                                    pageNumber={i + 1}
                                    scale={scale}
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
                <span className="about-cv-filename">{CV_FILENAME}</span>
                <a
                    href={CV_PDF_URL}
                    download={CV_FILENAME}
                    className="about-cv-download"
                    aria-label="Download CV"
                >
                    <DownloadIcon />
                    DOWNLOAD CV ↓
                </a>
            </div>
        </div>
    );
}
