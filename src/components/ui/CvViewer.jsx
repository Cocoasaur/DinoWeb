import { useRenderProfile } from '../../context/RenderProfileContext';
import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import resumePdf from '../../assets/resume/John_Arquesola_Resume.pdf';
import cvPdf from '../../assets/resume/John_Arquesola_Curriculum_Vitae.pdf';
import { getPdfRasterRatio } from '../../utils/pdfRenderBudget';

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

function PreviewPage({ pageNumber, width, aspect, rasterRatio }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    const [renderedSize, setRenderedSize] = useState('');
    const sizeKey = `${width}:${rasterRatio}`;
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            setVisible(entry.isIntersecting);
            if (!entry.isIntersecting) setRenderedSize('');
        }, {
            root: ref.current.closest('.about-cv-scroll'), rootMargin: '160px 0px',
        });
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);
    return (
        <div ref={ref} className="about-cv-page-wrap" data-page-number={pageNumber}
            aria-busy={visible && renderedSize !== sizeKey} style={{ width, minHeight: width * aspect }}>
            {visible && <Page pageNumber={pageNumber} width={width} devicePixelRatio={rasterRatio}
                className="about-cv-page" renderTextLayer={false} renderAnnotationLayer={false}
                onRenderSuccess={() => setRenderedSize(sizeKey)} />}
        </div>
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
    const { tier = 'high' } = useRenderProfile();
    const stackRef = useRef(null);
    const [activeDocumentId, setActiveDocumentId] = useState(DOCUMENTS[0].id);
    const [numPages, setNumPages] = useState(null);
    const [scale, setScale] = useState(1);
    const [loadError, setLoadError] = useState(false);
    const [pageSize, setPageSize] = useState({ width: 612, height: 792 });
    const [viewport, setViewport] = useState({ width: 612, pixelRatio: window.devicePixelRatio || 1 });
    const documentIdRef = useRef(activeDocumentId);
    useEffect(() => {
        const stack = stackRef.current;
        const measure = () => {
            const style = getComputedStyle(stack);
            const width = Math.max(1, stack.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight));
            const pixelRatio = window.devicePixelRatio || 1;
            setViewport(current => current.width === width && current.pixelRatio === pixelRatio ? current : { width, pixelRatio });
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(stack);
        window.addEventListener('resize', measure);
        return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
    }, []);
    const pageWidth = Math.min(pageSize.width, viewport.width) * scale;
    const pageAspect = pageSize.height / pageSize.width;
    const rasterRatio = getPdfRasterRatio(pageWidth, pageAspect, viewport.pixelRatio, tier);

    const activeDocument = DOCUMENTS.find(({ id }) => id === activeDocumentId) || DOCUMENTS[0];

    const zoomIn = () => setScale((s) => Math.min(MAX_SCALE, Math.round((s + SCALE_STEP) * 100) / 100));
    const zoomOut = () => setScale((s) => Math.max(MIN_SCALE, Math.round((s - SCALE_STEP) * 100) / 100));
    const selectDocument = (id) => {
        if (id === activeDocumentId) return;
        documentIdRef.current = id;
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
                <div ref={stackRef} className="about-cv-page-stack">
                    <Document
                        key={activeDocument.id}
                        file={activeDocument.url}
                        loading={<p className="about-cv-status" role="status">Loading {activeDocument.label}…</p>}
                        error={<p className="about-cv-status" role="alert">The document preview could not be loaded.</p>}
                        onLoadSuccess={async (pdf) => {
                            if (documentIdRef.current !== activeDocument.id) return;
                            setNumPages(pdf.numPages);
                            setLoadError(false);
                            try {
                                const firstPage = await pdf.getPage(1);
                                if (documentIdRef.current !== activeDocument.id) return;
                                const size = firstPage.getViewport({ scale: 1 });
                                setPageSize({ width: size.width, height: size.height });
                            } catch {
                                // Switching documents can destroy a pending PDF task.
                                // Keep the default page proportions until the next load.
                            }
                        }}
                        onLoadError={() => {
                            if (documentIdRef.current !== activeDocument.id) return;
                            setNumPages(0);
                            setLoadError(true);
                        }}
                    >
                        {Array.from({ length: numPages || 0 }, (_, i) => (
                            <PreviewPage key={`page-${i + 1}`} pageNumber={i + 1}
                                width={pageWidth} aspect={pageAspect} rasterRatio={rasterRatio} />
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
