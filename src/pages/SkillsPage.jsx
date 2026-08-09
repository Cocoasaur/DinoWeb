import React from 'react';
import { useTheme } from '../context/ThemeContext';

// Import all skill icons from the project's assets
// Frontend
import html5Icon from '../assets/icons/skills/frontend/HTML5.png';
import css3Icon from '../assets/icons/skills/frontend/CSS3.png';
import jsIcon from '../assets/icons/skills/frontend/JavaScript.png';
import tsIcon from '../assets/icons/skills/frontend/TypeScript.png';
import tailwindIcon from '../assets/icons/skills/frontend/TailwindCSS.png';
import tkinterIcon from '../assets/icons/skills/frontend/Tkinter.png';
import reactIcon from '../assets/icons/skills/frontend/React.png';
import threejsBlackIcon from '../assets/icons/skills/frontend/Three.js_black.png';
import threejsWhiteIcon from '../assets/icons/skills/frontend/Three.js_white.png';
import viteIcon from '../assets/icons/skills/frontend/Vite.png';

// Backend
import pythonIcon from '../assets/icons/skills/backend/Python.png';
import javaIcon from '../assets/icons/skills/backend/Java.png';
import nodejsIcon from '../assets/icons/skills/backend/Node.js.png';
import firebaseIcon from '../assets/icons/skills/backend/Firebase.png';

// Database
import sqliteIcon from '../assets/icons/skills/database/SQLite.png';
import mysqlIcon from '../assets/icons/skills/database/MySQL.png';
import firestoreIcon from '../assets/icons/skills/database/Firestore.png';

// Tools
import figmaIcon from '../assets/icons/skills/tools/Figma.png';
import canvaIcon from '../assets/icons/skills/tools/Canva.png';
import postmanIcon from '../assets/icons/skills/tools/Postman.png';
import vscodeIcon from '../assets/icons/skills/tools/Visual_Studio_Code.png';
import kimiIcon from '../assets/icons/skills/tools/Kimi.png';
import claudeIcon from '../assets/icons/skills/tools/Claude.png';
import godotengineIcon from '../assets/icons/skills/tools/Godot_Engine.png';
import gitIcon from '../assets/icons/skills/tools/Git.png';
import githubIcon from '../assets/icons/skills/tools/Github.png';

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
    categoryTitle: {
        fontFamily: "'Space Grotesk', monospace",
        color: 'var(--void-text-dim)',
        fontSize: '10px',
        letterSpacing: '0.3em',
    },
    skillName: {
        fontFamily: "'Inter', sans-serif",
        color: 'var(--void-text-full)',
        fontSize: '14px',
    },
};

function SkillCard({ name, icon }) {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <div
            className="flex items-center gap-2 px-3 py-2 border cursor-default select-none"
            style={{
                borderColor: 'var(--void-border)',
                backgroundColor: isHovered ? 'var(--skill-card-bg-hover)' : 'var(--skill-card-bg)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <img
                src={icon}
                alt={name}
                className="w-6 h-6 object-contain"
                loading="lazy"
                decoding="async"
                draggable={false}
                style={{
                    filter: isHovered ? 'brightness(1.1)' : 'none',
                    transition: 'filter 0.25s ease',
                }}
            />
            <span style={S.skillName}>{name}</span>
        </div>
    );
}

function CategorySection({ title, skills }) {
    return (
        <div className="h-full flex flex-col">
            <h3 className="uppercase mb-4" style={S.categoryTitle}>
                {title}
            </h3>
            <div
                className="border p-4 flex-1"
                style={{
                    borderColor: 'var(--void-border)',
                    backgroundColor: 'rgba(0,0,0,0.02)',
                    minHeight: '180px',
                }}
            >
                <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                        <SkillCard key={skill.name} name={skill.name} icon={skill.icon} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function SkillsPage() {
    const { isDark } = useTheme();

    const SKILL_CATEGORIES = [
        {
            title: 'FRONTEND',
            skills: [
                { name: 'HTML5', icon: html5Icon },
                { name: 'CSS3', icon: css3Icon },
                { name: 'JavaScript', icon: jsIcon },
                { name: 'TypeScript', icon: tsIcon },
                { name: 'TailwindCSS', icon: tailwindIcon },
                { name: 'Tkinter', icon: tkinterIcon },
                { name: 'React', icon: reactIcon },
                { name: 'Three.js', icon: isDark ? threejsWhiteIcon : threejsBlackIcon },
                { name: 'Vite', icon: viteIcon },
            ],
        },
        {
            title: 'BACKEND',
            skills: [
                { name: 'Python', icon: pythonIcon },
                { name: 'Java', icon: javaIcon },
                { name: 'Node.js', icon: nodejsIcon },
                { name: 'Firebase', icon: firebaseIcon },
            ],
        },
        {
            title: 'DATABASE',
            skills: [
                { name: 'SQLite', icon: sqliteIcon },
                { name: 'MySQL', icon: mysqlIcon },
                { name: 'Firestore', icon: firestoreIcon },
            ],
        },
        {
            title: 'TOOLS',
            skills: [
                { name: 'Figma', icon: figmaIcon },
                { name: 'Canva', icon: canvaIcon },
                { name: 'Postman', icon: postmanIcon },
                { name: 'Visual Studio Code', icon: vscodeIcon },
                { name: 'Kimi', icon: kimiIcon },
                { name: 'Claude', icon: claudeIcon },
                { name: 'Godot Engine', icon: godotengineIcon },
                { name: 'Git', icon: gitIcon },
                { name: 'Github', icon: githubIcon },
            ],
        },
    ];

    return (
        <div>
            {/* Header */}
            <div className="mb-10 pb-6 border-b" style={{ borderColor: 'var(--void-border)' }}>
                <p className="uppercase mb-2" style={S.label}>
                    FACE_02 / CAPABILITY_INDEX
                </p>
                <h2
                    className="text-4xl font-bold uppercase"
                    style={{ ...S.h2, letterSpacing: '0.18em' }}
                >
                    SKILLS
                </h2>
            </div>

            {/* 2x2 Grid */}
            <div className="grid grid-cols-1 min-[1024px]:grid-cols-2 gap-8">
                {SKILL_CATEGORIES.map(({ title, skills }) => (
                    <CategorySection key={title} title={title} skills={skills} />
                ))}
            </div>
        </div>
    );
}