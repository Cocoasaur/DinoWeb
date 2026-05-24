import React, { useState } from 'react';
import TiltCard from '../components/ui/TiltCard';
import ImageCarousel from '../components/ui/ImageCarousel';
import profileImage from '../assets/images/profile/me.png';

// Certificates
import aignite from '../assets/certifications/AIgnite.png';
import courseraExcel from '../assets/certifications/Coursera_Excel.png';
import courseraExcel1 from '../assets/certifications/Coursera_Excel1.png';
import zuittCodingBootcamp from '../assets/certifications/ZUITT_Free_Coding_Bootcamp.png';
import gdgBacolod from '../assets/certifications/GDG_Bacolod.png';
import googleForEducation from '../assets/certifications/Google_for_Education.png';
import ciscoIntroDS from '../assets/certifications/Cisco_Data_Science.png';

// ── Placeholder: update this with your actual PDF path ──────────────────────
import resumePdf from '../assets/resume/Resume_Arquesola.pdf';

const RESUME_PDF_URL = resumePdf;

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
        fontSize: '10px',
        letterSpacing: '0.2em',
    },
    val: {
        fontFamily: "'Inter', sans-serif",
        color: 'var(--void-text-full)',
        fontSize: '14px',
    },
};

const EDUCATION = [
    {
        year: '2023 — PRESENT',
        degree: 'Bachelor of Computer Science',
        school: 'University of San Agustin',
        desc: 'Focusing on software engineering, interactive systems, and web technologies.',
    },
    {
        year: '2021 — 2023',
        academic_track: 'STEM (Science, Technology, Engineering, and Mathematics)',
        school: "St. Anthony's College",
        desc: 'Foundation in programming, databases, and network fundamentals.',
    },
];

const CERTIFICATIONS = [
    aignite,
    courseraExcel,
    courseraExcel1,
    zuittCodingBootcamp,
    gdgBacolod,
    googleForEducation,
    ciscoIntroDS,
];

function TimelineItem({ year, degree, academic_track, school, desc }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="relative pl-8 pb-8 last:pb-0"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div
                className="absolute left-[5px] top-2 bottom-0 w-px"
                style={{ backgroundColor: 'var(--void-border)' }}
            />
            <div
                className="absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 transition-all duration-300"
                style={{
                    borderColor: hovered ? 'var(--void-accent)' : 'var(--void-border)',
                    backgroundColor: hovered ? 'var(--void-accent)' : 'transparent',
                    boxShadow: hovered ? '0 0 8px var(--void-accent)' : 'none',
                }}
            />
            <div>
                <p
                    className="text-[10px] tracking-[0.2em] uppercase mb-1"
                    style={{ fontFamily: "'Space Grotesk', monospace", color: 'var(--void-text-muted)' }}
                >
                    {year}
                </p>
                <h4
                    className="text-[15px] font-bold mb-1"
                    style={{ fontFamily: "'Space Grotesk', monospace", color: 'var(--void-text-full)' }}
                >
                    {degree || academic_track}
                </h4>
                <p
                    className="text-[13px] mb-2"
                    style={{ fontFamily: "'Inter', sans-serif", color: 'var(--void-text-dim)' }}
                >
                    {school}
                </p>
                <p
                    className="text-[13px] leading-[1.6]"
                    style={{ fontFamily: "'Inter', sans-serif", color: 'var(--void-text)' }}
                >
                    {desc}
                </p>
            </div>
        </div>
    );
}

// ── Resume Viewer Component ────────────────────────────────────────────────
function ResumeViewer() {
    const [scale, setScale] = useState(1.0);

    const zoomIn = () => setScale(s => Math.min(s + 0.1, 2.0));
    const zoomOut = () => setScale(s => Math.max(s - 0.1, 0.5));
    const resetZoom = () => setScale(1.0);

    // Inversely scale width/height so the scaled content fits in the viewport
    const iframeWidth = `${100 / scale}%`;
    const iframeHeight = `${100 / scale}%`;

    return (
        <div>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={zoomOut}
                        className="w-8 h-8 flex items-center justify-center border transition-all duration-200"
                        style={{
                            borderColor: 'var(--void-border)',
                            backgroundColor: 'var(--void-surface-80)',
                            color: 'var(--void-text-full)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--void-text-dim)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--void-border)'}
                        title="Zoom out"
                    >
                        −
                    </button>
                    <span
                        className="text-[11px] tracking-widest uppercase px-2"
                        style={{ fontFamily: "'Space Grotesk', monospace", color: 'var(--void-text-muted)' }}
                    >
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={zoomIn}
                        className="w-8 h-8 flex items-center justify-center border transition-all duration-200"
                        style={{
                            borderColor: 'var(--void-border)',
                            backgroundColor: 'var(--void-surface-80)',
                            color: 'var(--void-text-full)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--void-text-dim)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--void-border)'}
                        title="Zoom in"
                    >
                        +
                    </button>
                    <button
                        onClick={resetZoom}
                        className="w-8 h-8 flex items-center justify-center border transition-all duration-200 ml-1"
                        style={{
                            borderColor: 'var(--void-border)',
                            backgroundColor: 'var(--void-surface-80)',
                            color: 'var(--void-text-muted)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--void-text-dim)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--void-border)'}
                        title="Reset zoom"
                    >
                        ⟲
                    </button>
                </div>

                <a
                    href={RESUME_PDF_URL}
                    download
                    className="flex items-center gap-2 px-4 py-2 border text-[10px] tracking-[0.2em] uppercase transition-all duration-300"
                    style={{
                        fontFamily: "'Space Grotesk', monospace",
                        color: 'var(--void-text-dim)',
                        borderColor: 'var(--void-border)',
                        textDecoration: 'none',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.color = 'var(--void-text-full)';
                        e.currentTarget.style.borderColor = 'var(--void-text-dim)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.color = 'var(--void-text-dim)';
                        e.currentTarget.style.borderColor = 'var(--void-border)';
                    }}
                >
                    DOWNLOAD ↓
                </a>
            </div>

            {/* PDF Viewer — fixed zoom approach */}
            <div
                className="border"
                style={{
                    borderColor: 'var(--void-border)',
                    backgroundColor: 'var(--void-surface-80)',
                    height: '600px',
                    overflow: 'auto',
                }}
            >
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        transition: 'transform 0.2s ease-out',
                    }}
                >
                    <iframe
                        src={`${RESUME_PDF_URL}#toolbar=0&navpanes=0`}
                        title="Resume PDF"
                        className="border-0"
                        style={{
                            width: iframeWidth,
                            height: iframeHeight,
                            minWidth: '100%',
                            minHeight: '100%',
                        }}
                    />
                </div>
            </div>

            {/* Linked text below viewer */}
            <div className="mt-4 flex items-center justify-between">
                <a
                    href={RESUME_PDF_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] transition-colors duration-300"
                    style={{
                        fontFamily: "'Inter', sans-serif",
                        color: 'var(--void-text-dim)',
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                    }}
                    onMouseEnter={e => e.target.style.color = 'var(--void-text-full)'}
                    onMouseLeave={e => e.target.style.color = 'var(--void-text-dim)'}
                >
                    Open in new tab →
                </a>
                <span
                    className="text-[10px] tracking-widest uppercase"
                    style={{ fontFamily: "'Space Grotesk', monospace", color: 'var(--void-text-muted)' }}
                >
                    Resume_Arquesola.pdf
                </span>
            </div>
        </div>
    );
}

export default function AboutPage() {
    return (
        <div>
            {/* Header */}
            <div className="mb-10 pb-6 border-b" style={{ borderColor: 'var(--void-border)' }}>
                <p className="uppercase mb-2" style={S.label}>
                    FACE_01 / ENTITY_PROFILE
                </p>
                <h2
                    className="text-4xl font-bold uppercase"
                    style={{ ...S.h2, letterSpacing: '0.18em' }}
                >
                    About
                </h2>
            </div>

            {/* ═══════════════════════════════════════════════════════
                TOP SECTION: Introduction | Profile Picture
            ═══════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left — Introduction */}
                <div>
                    <h3 className="uppercase mb-5" style={S.h3}>
                        Introduction
                    </h3>
                    <p className="text-[15px] leading-[1.7] mb-6" style={S.p}>
                        Hi, I'm John Jessienel M. Arquesola. I'm a computer science student passionate
                        about exploring the endless possibilities of technology. I'm constantly
                        experimenting with new tools, refining my craft in programming and design,
                        and finding fresh ways to blend logic with imagination.
                    </p>
                    <p className="text-[15px] leading-[1.7] mb-6" style={S.p}>
                        For me, growth isn't just about learning new skills, it's about stretching
                        boundaries, embracing the unknown, and turning obstacles into opportunities.
                        Whether I'm sketching out a design, debugging a tricky line of code, or
                        exploring the next wave of innovation, I bring both creativity and
                        determination to the table.
                    </p>
                    <p className="text-[15px] leading-[1.7]" style={S.p}>
                        I don't just chase challenges, I welcome them, because each one is a chance
                        to create something meaningful, elegant, and lasting.
                    </p>
                </div>

                {/* Right — Profile Picture */}
                <div>
                    <h3 className="uppercase mb-5" style={S.h3}>
                        Profile Picture
                    </h3>
                    <div className="mb-0">
                        <TiltCard
                            className="rounded-2xl overflow-hidden border"
                            style={{
                                borderColor: 'var(--void-border)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                width: '386px',
                                height: '386px',
                            }}
                            tiltAmount={14}
                            scale={1.03}
                            depth={0}
                        >
                            <img
                                src={profileImage}
                                alt="Profile avatar"
                                className="w-full h-full object-cover"
                                draggable={false}
                            />
                        </TiltCard>
                    </div>
                </div>
            </div>

            {/* Divider 1: Top → Middle */}
            <div className="my-10 w-full h-px" style={{ backgroundColor: 'var(--void-border)' }} />

            {/* ═══════════════════════════════════════════════════════
                MIDDLE SECTION: Certifications (full width)
            ═══════════════════════════════════════════════════════ */}
            <div className="mb-0">
                <h3 className="uppercase mb-5" style={S.h3}>
                    Certifications
                </h3>
                <ImageCarousel images={CERTIFICATIONS} />
            </div>

            {/* Divider 2: Certifications → Resume */}
            <div className="my-10 w-full h-px" style={{ backgroundColor: 'var(--void-border)' }} />

            {/* ═══════════════════════════════════════════════════════
                RESUME VIEWER (full width)
            ═══════════════════════════════════════════════════════ */}
            <div className="mb-0">
                <h3 className="uppercase mb-5" style={S.h3}>
                    Resume
                </h3>
                <ResumeViewer />
            </div>

            {/* Divider 3: Resume → Bottom */}
            <div className="my-10 w-full h-px" style={{ backgroundColor: 'var(--void-border)' }} />

            {/* ═══════════════════════════════════════════════════════
                BOTTOM SECTION: Education | Parameters
            ═══════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left — Education Timeline */}
                <div>
                    <h3 className="uppercase mb-6" style={S.h3}>
                        Education
                    </h3>
                    <div>
                        {EDUCATION.map((item, idx) => (
                            <TimelineItem key={idx} {...item} />
                        ))}
                    </div>
                </div>

                {/* Right — Parameters */}
                <div>
                    <h3 className="uppercase mb-5" style={S.h3}>
                        Parameters
                    </h3>
                    <div className="space-y-3">
                        {[
                            ['ROLE', 'Full-Stack Developer'],
                            ['FOCUS', 'To Graduate'],
                            ['STATUS', 'Busy'],
                            ['LOCATION', 'Philippines'],
                        ].map(([label, value]) => (
                            <div
                                key={label}
                                className="flex justify-between items-center border-b pb-3"
                                style={{ borderColor: 'var(--void-border-dim)' }}
                            >
                                <span className="uppercase" style={S.key}>
                                    {label}
                                </span>
                                <span style={S.val}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}