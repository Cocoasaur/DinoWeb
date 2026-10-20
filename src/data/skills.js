import html5 from '../assets/icons/skills/frontend/HTML5.svg';
import css3 from '../assets/icons/skills/frontend/CSS3.svg';
import javascript from '../assets/icons/skills/frontend/JavaScript.svg';
import typescript from '../assets/icons/skills/frontend/TypeScript.svg';
import tailwind from '../assets/icons/skills/frontend/TailwindCSS.svg';
import tkinter from '../assets/icons/skills/frontend/Tkinter.svg';
import react from '../assets/icons/skills/frontend/React.svg';
import threeBlack from '../assets/icons/skills/frontend/Three.js_black.svg';
import threeWhite from '../assets/icons/skills/frontend/Three.js_white.svg';
import vite from '../assets/icons/skills/frontend/Vite.svg';
import python from '../assets/icons/skills/backend/Python.svg';
import java from '../assets/icons/skills/backend/Java.svg';
import node from '../assets/icons/skills/backend/Node.js.svg';
import firebase from '../assets/icons/skills/backend/Firebase.svg';
import sqlite from '../assets/icons/skills/database/SQLite.svg';
import mysql from '../assets/icons/skills/database/MySQL.svg';
import firestore from '../assets/icons/skills/database/Firestore.svg';
import figma from '../assets/icons/skills/tools/Figma.svg';
import canva from '../assets/icons/skills/tools/Canva.svg';
import postman from '../assets/icons/skills/tools/Postman.svg';
import vscode from '../assets/icons/skills/tools/Visual_Studio_Code.svg';
import kimi from '../assets/icons/skills/tools/Kimi.svg';
import claude from '../assets/icons/skills/tools/Claude.svg';
import godot from '../assets/icons/skills/tools/Godot_Engine.svg';
import git from '../assets/icons/skills/tools/Git.svg';
import github from '../assets/icons/skills/tools/Github.svg';

// One catalogue supplies the sculpture, filters, counts, and readable index.
// Preserve the original toolkit without inventing proficiency scores.
export const SKILL_CATEGORIES = [
    {
        id: 'frontend', number: '01', title: 'Frontend', short: 'Interface',
        heading: 'What you see.\nWhat you interact with.',
        description: 'The languages and libraries I use to build interfaces for the web and desktop.',
        skills: [
            { name: 'HTML5', icon: html5, kind: 'Markup' },
            { name: 'CSS3', icon: css3, kind: 'Styling' },
            { name: 'JavaScript', icon: javascript, kind: 'Language' },
            { name: 'TypeScript', icon: typescript, kind: 'Language' },
            { name: 'TailwindCSS', icon: tailwind, kind: 'CSS framework' },
            { name: 'Tkinter', icon: tkinter, kind: 'Desktop UI' },
            { name: 'React', icon: react, kind: 'UI library' },
            { name: 'Three.js', icon: threeBlack, darkIcon: threeWhite, kind: '3D graphics' },
            { name: 'Vite', icon: vite, kind: 'Build tool' },
        ],
    },
    {
        id: 'backend', number: '02', title: 'Backend', short: 'Logic',
        heading: 'The logic\nbehind the experience.',
        description: 'Languages, runtimes, and services that connect the interface to what happens behind it.',
        skills: [
            { name: 'Python', icon: python, kind: 'Language' },
            { name: 'Java', icon: java, kind: 'Language' },
            { name: 'Node.js', icon: node, kind: 'Runtime' },
            { name: 'Firebase', icon: firebase, kind: 'App platform' },
        ],
    },
    {
        id: 'database', number: '03', title: 'Database', short: 'Data',
        heading: 'A place for\nevery piece of data.',
        description: 'Relational databases and document storage for organising and working with application data.',
        skills: [
            { name: 'SQLite', icon: sqlite, kind: 'Relational' },
            { name: 'MySQL', icon: mysql, kind: 'Relational' },
            { name: 'Firestore', icon: firestore, kind: 'Document store' },
        ],
    },
    {
        id: 'tools', number: '04', title: 'Tools', short: 'Workflow',
        heading: 'From a first idea\nto the next commit.',
        description: 'The design, development, and collaboration tools I reach for along the way.',
        skills: [
            { name: 'Figma', icon: figma, kind: 'Interface design' },
            { name: 'Canva', icon: canva, kind: 'Visual design' },
            { name: 'Postman', icon: postman, kind: 'API testing' },
            { name: 'Visual Studio Code', icon: vscode, kind: 'Code editor' },
            { name: 'Kimi', icon: kimi, kind: 'AI assistant' },
            { name: 'Claude', icon: claude, kind: 'AI assistant' },
            { name: 'Godot Engine', icon: godot, kind: 'Game engine' },
            { name: 'Git', icon: git, kind: 'Version control' },
            { name: 'GitHub', icon: github, kind: 'Collaboration' },
        ],
    },
];

export const SKILL_COUNT = SKILL_CATEGORIES.reduce((total, category) => total + category.skills.length, 0);
