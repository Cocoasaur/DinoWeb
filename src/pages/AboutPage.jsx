import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import DeferredSection from '../components/ui/DeferredSection';
import TiltCard from '../components/ui/TiltCard';
import OverlayNavIcon from '../components/ui/OverlayNavIcon';
import GitHubContributions from '../components/ui/GitHubContributions';
import { useTimelineSpy } from '../hooks/useTimelineSpy';
import profileImage from '../assets/images/profile/me.webp';

const CvViewer = lazy(() => import('../components/ui/CvViewer'));

// Certificates
import aignite from '../assets/certifications/AIgnite.webp';
import courseraExcel from '../assets/certifications/Coursera_Excel.webp';
import courseraExcel1 from '../assets/certifications/Coursera_Excel1.webp';
import zuittCodingBootcamp from '../assets/certifications/ZUITT_Free_Coding_Bootcamp.webp';
import gdgBacolod from '../assets/certifications/GDG_Bacolod.webp';
import googleForEducation from '../assets/certifications/Google_for_Education.webp';
import ciscoIntroDS from '../assets/certifications/Cisco_Data_Science.webp';

const DOT_GLOW_STAGGER_MS = 400;

const S = {
    label: {
        fontFamily: "'Space Grotesk', monospace",
        color: 'var(--void-text-dim)',
        fontSize: '10px',
        letterSpacing: '0.3em',
    },
    h2: {
        fontFamily: "'Space Grotesk', monospace",
        color: 'var(--void-text-full)',
    },
    h3: {
        fontFamily: "'Space Grotesk', monospace",
        color: 'var(--void-text-dim)',
        fontSize: '10px',
        letterSpacing: '0.3em',
    },
    p: {
        fontFamily: "'Inter', sans-serif",
        color: 'var(--void-text)',
    },
    key: {
        fontFamily: "'Space Grotesk', monospace",
        color: 'var(--void-text-muted)',
    },
    val: {
        fontFamily: "'Inter', sans-serif",
        color: 'var(--void-text-full)',
    },
};

const EDUCATION = [
    {
        year: '2023 — PRESENT',
        degree: 'Bachelor of Science in Computer Science',
        school: 'University of San Agustin',
        desc: 'Focusing on software development, algorithms, and data structures.',
    },
    {
        year: '2021 — 2023',
        academic_track: 'STEM (Science, Technology, Engineering, and Mathematics)',
        school: "St. Anthony's College",
        desc: 'Foundation in programming, science, and mathematics.',
    },
    {
        year: '2011 — 2020',
        degree: 'Junior High School and Elementary Education',
        school: 'Dao Catholic High School, Inc.',
        desc: 'Completed elementary and junior high school education.',
    },
];

const CERTIFICATIONS = [
    { id: 'aignite', src: aignite, title: 'A.IGNITE', issuer: 'NVIDIA AI Academy PH', category: 'AI & Data' },
    { id: 'excel-start', src: courseraExcel, title: 'Getting Started with Microsoft Excel', issuer: 'Coursera', category: 'Excel' },
    { id: 'excel-data', src: courseraExcel1, title: 'Finding, Sorting, & Filtering Data in Microsoft Excel', issuer: 'Coursera', category: 'Excel' },
    { id: 'zuitt', src: zuittCodingBootcamp, title: 'Basic Web Development Workshop', issuer: 'ZUITT', category: 'Programming' },
    { id: 'devfest', src: gdgBacolod, title: 'DevFest 2023', issuer: 'GDG Bacolod', category: 'Tech Events' },
    { id: 'talkbot', src: googleForEducation, title: 'Code a Joke-Telling Talkbot', issuer: 'Google for Education', category: 'Programming' },
    { id: 'data-science', src: ciscoIntroDS, title: 'Introduction to Data Science', issuer: 'Cisco Networking Academy', category: 'AI & Data' },
];

const CERT_CATEGORIES = ['All', 'AI & Data', 'Programming', 'Excel', 'Tech Events'];

function useStaggeredReveal(target, delayMs) {
    const [lit, setLit] = useState(target);
    const timerRef = useRef(0);

    useEffect(() => {
        clearTimeout(timerRef.current);

        if (target < lit) {
            setLit(target);
            return;
        }

        if (target > lit) {
            timerRef.current = setTimeout(() => {
                setLit((current) => Math.min(current + 1, target));
            }, delayMs);
        }

        return () => clearTimeout(timerRef.current);
    }, [target, lit, delayMs]);

    return lit;
}

function TimelineItem({ year, degree, academic_track, school, desc, active, ref }) {
    const lit = active;

    return (
        <div
            ref={ref}
            className="about-timeline-item relative pl-8 pb-8 last:pb-0"
        >
            <div
                className="about-timeline-line absolute left-1.5 -translate-x-1/2 top-3 -bottom-3 last:bottom-0 w-px"
                style={{ backgroundColor: 'var(--void-border)' }}
            />
            <div
                className="about-timeline-dot absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 transition-all duration-300"
                style={{
                    borderColor: lit ? 'var(--void-accent)' : 'var(--void-border)',
                    backgroundColor: lit ? 'var(--void-accent)' : 'transparent',
                    boxShadow: lit ? '0 0 10px var(--void-accent)' : 'none',
                }}
            />
            <div>
                <p
                    className="about-timeline-year text-[10px] tracking-[0.2em] uppercase mb-1"
                    style={{ fontFamily: "'Space Grotesk', monospace", color: 'var(--void-text-muted)' }}
                >
                    {year}
                </p>
                <h4
                    className="about-timeline-title text-[15px] font-bold mb-1"
                    style={{ fontFamily: "'Space Grotesk', monospace", color: 'var(--void-text-full)' }}
                >
                    {degree || academic_track}
                </h4>
                <p
                    className="about-timeline-school text-[13px] mb-2"
                    style={{ fontFamily: "'Inter', sans-serif", color: 'var(--void-text-dim)' }}
                >
                    {school}
                </p>
                <p
                    className="about-timeline-desc text-[13px] leading-[1.6]"
                    style={{ fontFamily: "'Inter', sans-serif", color: 'var(--void-text)' }}
                >
                    {desc}
                </p>
            </div>
        </div>
    );
}

export default function AboutPage() {
    const { itemRefs, activeIndex } = useTimelineSpy(EDUCATION.length);
    const litIndex = useStaggeredReveal(activeIndex, DOT_GLOW_STAGGER_MS);
    const [lightboxCertificate, setLightboxCertificate] = useState(null);
    const [certCategory, setCertCategory] = useState('All');
    const [certPage, setCertPage] = useState(0);
    const [certPageSize, setCertPageSize] = useState(() =>
        window.matchMedia('(min-width: 768px)').matches ? 9 : 6
    );

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 768px)');
        const onChange = (e) => setCertPageSize(e.matches ? 9 : 6);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
        if (lightboxCertificate === null) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setLightboxCertificate(null);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [lightboxCertificate]);

    const filteredCerts = certCategory === 'All'
        ? CERTIFICATIONS
        : CERTIFICATIONS.filter(cert => cert.category === certCategory);
    const certTotalPages = Math.max(1, Math.ceil(filteredCerts.length / certPageSize));
    const certSafePage = Math.min(certPage, certTotalPages - 1);
    const certStart = certSafePage * certPageSize;
    const visibleCerts = filteredCerts.slice(certStart, certStart + certPageSize);

    return (
        <div className="about-page">
            {/* Header */}
            <div className="about-header mb-10 pb-6 border-b" style={{ borderColor: 'var(--void-border)' }}>
                <p className="about-label uppercase mb-2" style={S.label}>
                    FACE_01 / ENTITY_PROFILE
                </p>
                <h2
                    className="about-title text-4xl font-bold uppercase"
                    style={{ ...S.h2, letterSpacing: '0.18em' }}
                >
                    About
                </h2>
            </div>

            {/* ═══════════════════════════════════════════════════════
                TOP SECTION: Introduction | Profile Picture
            ═══════════════════════════════════════════════════════ */}
            <div className="about-grid grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left — Introduction */}
                <div className="about-section about-introduction">
                    <h3 className="about-section-title uppercase mb-5" style={S.h3}>
                        Introduction
                    </h3>
                    <p className="about-copy text-[15px] leading-[1.7] mb-6" style={S.p}>
                        Hi, I'm John Jessienel M. Arquesola. I'm a computer science student passionate
                        about exploring the endless possibilities of technology. I'm constantly
                        experimenting with new tools, refining my craft in programming and design,
                        and finding fresh ways to blend logic with imagination.
                    </p>
                    <p className="about-copy text-[15px] leading-[1.7] mb-6" style={S.p}>
                        For me, growth isn't just about learning new skills, it's about stretching
                        boundaries, embracing the unknown, and turning obstacles into opportunities.
                        Whether I'm sketching out a design, debugging a tricky line of code, or
                        exploring the next wave of innovation, I bring both creativity and
                        determination to the table.
                    </p>
                    <p className="about-copy text-[15px] leading-[1.7]" style={S.p}>
                        I don't just chase challenges, I welcome them, because each one is a chance
                        to create something meaningful, elegant, and lasting.
                    </p>
                </div>

                {/* Right — Profile Picture */}
                <div className="about-section about-profile-section">
                    <h3 className="about-section-title uppercase mb-5" style={S.h3}>
                        Profile Picture
                    </h3>
                    <div className="about-profile-wrap mb-0">
                        <TiltCard
                            className="about-profile-card rounded-2xl overflow-hidden border"
                            style={{
                                borderColor: 'var(--void-border)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                            }}
                            tiltAmount={14}
                            scale={1.03}
                            depth={0}
                        >
                            <img
                                src={profileImage}
                                alt="Profile avatar"
                                className="about-profile-image w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                                draggable={false}
                            />
                        </TiltCard>
                    </div>
                </div>
            </div>

            {/* Divider 1: Top → Middle */}
            <div className="about-divider my-10 w-full h-px" style={{ backgroundColor: 'var(--void-border)' }} />

            {/* ═══════════════════════════════════════════════════════
                MIDDLE SECTION: Certifications (full width)
            ═══════════════════════════════════════════════════════ */}
            <div className="about-section about-certifications mb-0">
                <h3 className="about-section-title uppercase mb-5" style={S.h3}>
                    Certifications
                </h3>
                <div className="about-cert-filters" role="group" aria-label="Filter certifications by topic">
                    {CERT_CATEGORIES.map(category => (
                        <button
                            key={category}
                            type="button"
                            className="about-cert-filter"
                            aria-pressed={certCategory === category}
                            aria-controls="about-certifications-grid"
                            onClick={() => {
                                setCertCategory(category);
                                setCertPage(0);
                            }}
                        >
                            {category}
                            <span className="about-cert-filter-count" aria-hidden="true">
                                {category === 'All' ? CERTIFICATIONS.length : CERTIFICATIONS.filter(cert => cert.category === category).length}
                            </span>
                        </button>
                    ))}
                </div>
                <p className="about-cert-results" role="status">
                    {filteredCerts.length} {filteredCerts.length === 1 ? 'certificate' : 'certificates'}
                    {certCategory === 'All' ? ' across all topics' : ` in ${certCategory}`}
                </p>
                <div id="about-certifications-grid" className="about-certifications-grid grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {visibleCerts.map(cert => (
                        <button
                            key={cert.id}
                            type="button"
                            aria-label={`View ${cert.title} certificate from ${cert.issuer}`}
                            className="about-cert-cell relative border overflow-hidden cursor-zoom-in"
                            onClick={() => setLightboxCertificate(cert)}
                        >
                            <span className="about-cert-thumbnail block aspect-[4/3]">
                                <img
                                    src={cert.src}
                                    alt=""
                                    className="w-full h-full object-contain p-2"
                                    loading="lazy"
                                    decoding="async"
                                    draggable={false}
                                />
                            </span>
                            <span className="about-cert-caption">
                                <span className="about-cert-title" title={cert.title}>{cert.title}</span>
                                <span className="about-cert-issuer">{cert.issuer}</span>
                                <span className="about-cert-topic">{cert.category}</span>
                            </span>
                        </button>
                    ))}
                </div>

                {certTotalPages > 1 && <div
                    className="about-certifications-pagination"
                    role="navigation"
                    aria-label="Certifications pages"
                >
                    <button
                        type="button"
                        aria-label="Previous page"
                        className="about-cert-pagination-btn about-cert-pagination-arrow"
                        disabled={certSafePage === 0}
                        onClick={() => setCertPage(certSafePage - 1)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    {Array.from({ length: certTotalPages }, (_, i) => (
                        <button
                            key={i}
                            type="button"
                            aria-label={`Page ${i + 1}`}
                            aria-current={i === certSafePage ? 'page' : undefined}
                            className={`about-cert-pagination-btn${i === certSafePage ? ' about-cert-pagination-btn--active' : ''}`}
                            onClick={() => setCertPage(i)}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        type="button"
                        aria-label="Next page"
                        className="about-cert-pagination-btn about-cert-pagination-arrow"
                        disabled={certSafePage === certTotalPages - 1}
                        onClick={() => setCertPage(certSafePage + 1)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                </div>}
            </div>

            {/* ── Certification lightbox — portaled to <body> so the
                overlay panel's transform can't contain it ── */}
            {lightboxCertificate !== null && createPortal(
                <div
                    className="cert-lightbox fixed inset-0 z-[150] flex items-center justify-center"
                    style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(6px)',
                    }}
                    onClick={() => setLightboxCertificate(null)}
                >
                    <div
                        className="cert-lightbox-in relative flex items-center justify-center max-w-[92vw] max-h-[88vh] border"
                        style={{ borderColor: 'var(--void-border)', boxShadow: '0 16px 64px rgba(0,0,0,0.5)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={lightboxCertificate.src}
                            alt={`${lightboxCertificate.title} certificate from ${lightboxCertificate.issuer}`}
                            className="max-w-[92vw] max-h-[88vh] object-contain"
                            draggable={false}
                        />
                    </div>
                    <button
                        type="button"
                        aria-label="Close certificate"
                        className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center border cursor-pointer"
                        style={{
                            backgroundColor: 'var(--void-surface-80)',
                            borderColor: 'var(--void-border)',
                            color: 'var(--void-text-full)',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = 'var(--void-surface)';
                            e.currentTarget.style.borderColor = 'var(--void-text-dim)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'var(--void-surface-80)';
                            e.currentTarget.style.borderColor = 'var(--void-border)';
                        }}
                        onClick={() => setLightboxCertificate(null)}
                    >
                        <OverlayNavIcon variant="close" />
                    </button>
                </div>,
                document.body
            )}

            {/* Divider 2: Certifications → CV Viewer */}
            <div className="about-divider my-10 w-full h-px" style={{ backgroundColor: 'var(--void-border)' }} />

            {/* ═══════════════════════════════════════════════════════
                MIDDLE SECTION: Document Viewer (full width)
            ═══════════════════════════════════════════════════════ */}
            <div className="about-section about-cv-viewer mb-0">
                <h3 className="about-section-title uppercase mb-5" style={S.h3}>
                    Résumé and Curriculum Vitae
                </h3>
                <DeferredSection minHeight={500}>
                    <Suspense fallback={null}>
                        <CvViewer />
                    </Suspense>
                </DeferredSection>
            </div>

            {/* Divider: CV Viewer → GitHub Contributions */}
            <div className="about-divider my-10 w-full h-px" style={{ backgroundColor: 'var(--void-border)' }} />

            {/* ═══════════════════════════════════════════════════════
                MIDDLE SECTION: GitHub Contributions (full width)
            ═══════════════════════════════════════════════════════ */}
            <div className="about-section about-contributions mb-0">
                <h3 className="about-section-title uppercase mb-5" style={S.h3}>
                    GitHub Contributions
                </h3>
                <DeferredSection>
                    <GitHubContributions username="Cocoasaur" />
                </DeferredSection>
            </div>

            {/* Divider 3: GitHub Contributions → Bottom */}
            <div className="about-divider my-10 w-full h-px" style={{ backgroundColor: 'var(--void-border)' }} />

            {/* ═══════════════════════════════════════════════════════
                BOTTOM SECTION: Education | Parameters
            ═══════════════════════════════════════════════════════ */}
            <div className="about-bottom-grid grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left — Education Timeline */}
                <div className="about-section about-education">
                    <h3 className="about-section-title uppercase mb-6" style={S.h3}>
                        Education
                    </h3>
                    <div>
                        {EDUCATION.map((item, idx) => (
                            <TimelineItem
                                key={idx}
                                ref={(el) => {
                                    itemRefs.current[idx] = el;
                                }}
                                {...item}
                                active={idx <= litIndex}
                            />
                        ))}
                    </div>
                </div>

                {/* Right — Parameters */}
                <div className="about-section about-parameter-section">
                    <h3 className="about-section-title uppercase mb-5" style={S.h3}>
                        Parameters
                    </h3>
                    <div className="about-parameters space-y-3">
                        {[
                            ['ROLE', 'Full-Stack Developer'],
                            ['FOCUS', 'To Graduate'],
                            ['STATUS', 'Busy'],
                            ['LOCATION', 'Philippines'],
                        ].map(([label, value]) => (
                            <div
                                key={label}
                                className="about-parameter-row flex justify-between items-center border-b pb-3"
                                style={{ borderColor: 'var(--void-border-dim)' }}
                            >
                                <span className="about-parameter-key uppercase" style={S.key}>
                                    {label}
                                </span>
                                <span className="about-parameter-value" style={S.val}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
