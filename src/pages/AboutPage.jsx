import { useState, useEffect, useRef, lazy, Suspense, Fragment } from 'react';
import { createPortal } from 'react-dom';
import DeferredSection from '../components/ui/DeferredSection';
import TiltCard from '../components/ui/TiltCard';
import OverlayNavIcon from '../components/ui/OverlayNavIcon';
import GitHubContributions from '../components/ui/GitHubContributions';
import { useAboutAnimations, useAboutCertificateAnimations } from '../hooks/useAboutAnimations';
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

const S = {
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

function AboutCopy({ children, className }) {
    const words = children.replace(/\s+/g, ' ').trim().split(' ');
    return (
        <p className={className} style={S.p}>
            {words.map((word, index) => (
                <Fragment key={index}>
                    <span className="about-copy-word">{word}</span>
                    {index < words.length - 1 ? ' ' : null}
                </Fragment>
            ))}
        </p>
    );
}

function ChapterHeader({ number, title, note, id }) {
    return (
        <div className="about-chapter-bar">
            <h3 id={id} className="about-section-title">
                <span className="about-chapter-number">{number}</span> / {title}
            </h3>
            <span className="about-chapter-note">{note}</span>
            <span className="about-divider" aria-hidden="true" />
        </div>
    );
}

function TimelineItem({ year, degree, academic_track, school, desc }) {
    return (
        <div
            className="about-timeline-item relative pl-8 pb-8 last:pb-0"
        >
            <div
                className="about-timeline-line absolute left-1.5 -translate-x-1/2 top-3 -bottom-3 last:bottom-0 w-px"
                style={{ backgroundColor: 'var(--void-border)' }}
            >
                <span className="about-timeline-line-fill" />
            </div>
            <div
                className="about-timeline-dot absolute left-0 top-1.5 w-3 h-3 rounded-full border-2"
                style={{
                    borderColor: 'var(--void-border)',
                }}
            >
                <span className="about-timeline-dot-fill" />
            </div>
            <div className="about-timeline-content">
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

export default function AboutPage({ motionReady = true }) {
    const pageRef = useRef(null);
    const galleryRef = useRef(null);
    const paginationPanRef = useRef(false);
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

    useAboutAnimations(pageRef, motionReady);
    useAboutCertificateAnimations(galleryRef, certCategory, certSafePage, certPageSize, paginationPanRef);

    const changeCertificatePage = (nextPage) => {
        if (nextPage === certSafePage) return;
        paginationPanRef.current = true;
        setCertPage(nextPage);
    };

    return (
        <div ref={pageRef} className="about-page about-page--grid">
            <div className="about-scroll-progress" aria-hidden="true">
                <span className="about-scroll-progress-fill" />
            </div>
            <header className="about-header">
                <div className="about-heading-cell">
                    <h2 className="about-title" aria-label="About">
                        <span className="about-title-mask" aria-hidden="true">
                            {'About'.split('').map((letter, index) => (
                                <span key={index} className="about-title-char">{letter}</span>
                            ))}{' '}
                            <em className="about-title-accent">me.</em>
                        </span>
                    </h2>
                    <p className="about-heading-note">A work in progress. Always moving forward.</p>
                </div>
            </header>

            <div className="about-grid">
                <section className="about-section about-introduction about-grid-cell" aria-labelledby="about-intro-heading">
                    <div className="about-cell-bar">
                        <span className="about-cell-index">01.1</span>
                        <span>Introduction</span>
                    </div>
                    <div className="about-cell-content">
                        <h3 id="about-intro-heading" className="about-intro-heading">Logic meets <em>imagination.</em></h3>
                        <AboutCopy className="about-copy">
                            Hi, I'm John Jessienel M. Arquesola, a computer science student
                            exploring programming and design. I experiment with new tools
                            and find fresh ways to blend logic with imagination.
                        </AboutCopy>
                        <AboutCopy className="about-copy">
                            From sketching a design to debugging a tricky line of code,
                            I learn by taking on challenges. Each one is a chance to
                            create something meaningful, elegant, and lasting.
                        </AboutCopy>
                    </div>
                </section>
                <section className="about-section about-profile-section about-grid-cell" aria-label="Portrait">
                    <div className="about-cell-bar">
                        <span className="about-cell-index">01.2</span>
                        <span>Behind the screen</span>
                    </div>
                    <div className="about-profile-wrap">
                        <div className="about-profile-parallax">
                            <TiltCard className="about-profile-card" tiltAmount={6} scale={1.01} depth={0} glare={false}>
                                <img
                                    src={profileImage}
                                    alt="John Jessienel M. Arquesola"
                                    className="about-profile-image"
                                    decoding="async"
                                    draggable={false}
                                />
                            </TiltCard>
                        </div>
                    </div>
                    <p className="about-portrait-caption"><span>Computer science student</span><span>Philippines</span></p>
                </section>
            </div>

            <section className="about-section about-certifications" aria-labelledby="about-cert-heading">
                <ChapterHeader number="02" title="Certifications" note="Learning, put into practice" id="about-cert-heading" />
                <div className="about-cert-tools">
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
                </div>
                <div ref={galleryRef} id="about-certifications-grid" className="about-certifications-grid">
                    {visibleCerts.map(cert => (
                        <div key={cert.id} className="about-cert-frame">
                            <button
                                type="button"
                                aria-label={`View ${cert.title} certificate from ${cert.issuer}`}
                                className="about-cert-cell cursor-zoom-in"
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
                        </div>
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
                        onClick={() => changeCertificatePage(certSafePage - 1)}
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
                            onClick={() => changeCertificatePage(i)}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        type="button"
                        aria-label="Next page"
                        className="about-cert-pagination-btn about-cert-pagination-arrow"
                        disabled={certSafePage === certTotalPages - 1}
                        onClick={() => changeCertificatePage(certSafePage + 1)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                </div>}
            </section>

            {/* ── Certification lightbox — portaled to <body> so the
                overlay panel's transform can't contain it ── */}
            {lightboxCertificate !== null && createPortal(
                <div
                    className="cert-lightbox fixed inset-0 z-[150] flex items-center justify-center"
                    data-cursor-label="CLOSE"
                    style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(6px)',
                    }}
                    onClick={() => setLightboxCertificate(null)}
                >
                    <div
                        className="cert-lightbox-in relative flex items-center justify-center max-w-[92vw] max-h-[88vh] border"
                        data-cursor-label=""
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

            <section className="about-section about-cv-viewer" aria-labelledby="about-documents-heading">
                <ChapterHeader number="03" title="Documents" note="The details, on paper" id="about-documents-heading" />
                <div className="about-document-cell">
                    <div className="about-document-reveal">
                        <DeferredSection minHeight="calc(var(--about-cv-height) + 116px)">
                            <Suspense fallback={null}>
                                <CvViewer />
                            </Suspense>
                        </DeferredSection>
                    </div>
                </div>
            </section>

            <section className="about-section about-contributions" aria-labelledby="about-activity-heading">
                <ChapterHeader number="04" title="GitHub activity" note="One contribution at a time" id="about-activity-heading" />
                <div className="about-document-cell">
                    <div className="about-document-reveal">
                        <DeferredSection>
                            <GitHubContributions username="Cocoasaur" />
                        </DeferredSection>
                    </div>
                </div>
            </section>

            <section aria-labelledby="about-background-heading">
                <ChapterHeader number="05" title="Background" note="The journey so far" id="about-background-heading" />
                <div className="about-bottom-grid">
                    <section className="about-section about-education about-grid-cell" aria-labelledby="about-education-heading">
                        <div className="about-cell-bar"><span className="about-cell-index">05.1</span><h3 id="about-education-heading">Education</h3></div>
                        <div className="about-cell-content">
                            {EDUCATION.map((item, idx) => <TimelineItem key={idx} {...item} />)}
                        </div>
                    </section>
                    <section className="about-section about-parameter-section about-grid-cell" aria-labelledby="about-details-heading">
                        <div className="about-cell-bar"><span className="about-cell-index">05.2</span><h3 id="about-details-heading">At a glance</h3></div>
                        <div className="about-parameters">
                            {[
                                ['ROLE', 'Full-Stack Developer'],
                                ['STUDY', 'Computer Science'],
                                ['INTERESTS', 'Programming & Design'],
                                ['LOCATION', 'Philippines'],
                            ].map(([label, value]) => (
                                <div key={label} className="about-parameter-cell">
                                    <div className="about-parameter-row">
                                        <span className="about-parameter-key" style={S.key}>{label}</span>
                                        <span className="about-parameter-value" style={S.val}>{value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </section>
        </div>
    );
}
