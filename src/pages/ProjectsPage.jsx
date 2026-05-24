import { useState } from 'react';
import { PROJECTS, STATUS_COLORS } from '../data/projectsData';
import ProjectModal from '../components/ui/ProjectModal';

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
    projectName: {
        fontFamily: "'Space Grotesk', monospace",
        color: 'var(--void-text-full)',
    },
    body: {
        fontFamily: "'Inter', sans-serif",
        color: 'var(--void-text)',
    },
    muted: {
        fontFamily: "'Space Grotesk', monospace",
        color: 'var(--void-text-muted)',
    },
    stack: {
        fontFamily: "'Space Grotesk', monospace",
        color: 'var(--void-text-muted)',
        fontSize: '10px',
        letterSpacing: '0.15em',
    },
};

function StatusBadge({ status }) {
    const color = STATUS_COLORS[status] || '#888';
    return (
        <span
            className="inline-flex items-center gap-2 px-3 py-1.5 border text-[11px] tracking-[0.15em] uppercase"
            style={{
                fontFamily: "'Space Grotesk', monospace",
                color: 'var(--void-text-full)',
                borderColor: 'var(--void-border)',
                backgroundColor: 'transparent',
            }}
        >
            <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}`,
                }}
            />
            {status}
        </span>
    );
}

function ProjectCard({ project, onClick }) {
    const { id, name, status, shortDesc, stack } = project;

    return (
        <div
            onClick={onClick}
            className="border p-6 md:p-8 transition-all duration-300 cursor-pointer group"
            style={{
                borderColor: 'var(--void-border)',
                backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--void-surface-80)';
                e.currentTarget.style.borderColor = 'var(--void-text-dim)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'var(--void-border)';
            }}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-baseline gap-4">
                    <span style={{ ...S.muted, fontSize: '10px' }}>
                        {id}_
                    </span>
                    <h3
                        className="text-lg md:text-xl tracking-[0.15em] uppercase"
                        style={S.projectName}
                    >
                        {name}
                    </h3>
                </div>
                <StatusBadge status={status} />
            </div>

            <p className="text-sm leading-relaxed mb-5" style={S.body}>
                {shortDesc}
            </p>

            <div className="flex gap-4 flex-wrap">
                {stack.map((s) => (
                    <span key={s} style={S.stack}>
                        {s}
                    </span>
                ))}
            </div>
        </div>
    );
}

/**
 * ProjectsPage
 *
 * `selectedProject` and `onSelectProject` are controlled by App.jsx so the
 * sticky close/back button in the overlay header can read and update the same
 * state without any ref-callback indirection.
 */
export default function ProjectsPage({ selectedProject, onSelectProject }) {
    const [searchQuery, setSearchQuery] = useState('');

    // If a project is selected, render its detail modal.
    if (selectedProject) {
        return (
            <div className="h-full">
                <ProjectModal
                    project={selectedProject}
                // onBack is intentionally omitted here — the sticky button
                // in the overlay header handles navigation back to the list
                // by calling onSelectProject(null) directly.
                />
            </div>
        );
    }

    const filteredProjects = PROJECTS.filter(project => {
        if (!searchQuery) return true;

        const queryLower = searchQuery.toLowerCase();
        return (
            project.name.toLowerCase().includes(queryLower) ||
            project.role.toLowerCase().includes(queryLower) ||
            project.status.toLowerCase().includes(queryLower) ||
            project.stack.some(skill => skill.toLowerCase().includes(queryLower))
        );
    });

    return (
        <div>
            {/* Header */}
            <div
                className="mb-10 pb-6 border-b"
                style={{ borderColor: 'var(--void-border)' }}
            >
                <p className="uppercase mb-2" style={S.label}>
                    FACE_03 / PROJECTS_LIST
                </p>
                <h2
                    className="text-4xl font-bold tracking-[0.15em] uppercase"
                    style={S.h2}
                >
                    PROJECTS
                </h2>
                {/* Search Bar */}
                <div className="relative mt-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search projects by name, tech stack, status, or role..."
                        className="w-full px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-[var(--void-text-full)] bg-transparent text-[var(--void-text)]"
                        style={{
                            borderColor: 'var(--void-border)',
                            color: 'var(--void-text)',
                            fontFamily: "'Inter', sans-serif",
                        }}
                    />
                </div>
            </div>

            {/* Project list */}
            <div className="space-y-5">
                {filteredProjects.length === 0 ? (
                    <p className="text-center text-[var(--void-text-muted)]">
                        No projects found matching your search.
                    </p>
                ) : (
                    filteredProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onClick={() => onSelectProject(project)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}