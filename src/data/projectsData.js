/* ═══════════════════════════════════════════════════════════════
   PROJECT DATA
   ═══════════════════════════════════════════════════════════════ */

// ── Tool icons ──
// Frontend
import html5Icon from '../assets/icons/skills/frontend/HTML5.png';
import css3Icon from '../assets/icons/skills/frontend/CSS3.png';
import jsIcon from '../assets/icons/skills/frontend/JavaScript.png';
import tkinterIcon from '../assets/icons/skills/frontend/Tkinter.png';

// Backend
import pythonIcon from '../assets/icons/skills/backend/Python.png';
import javaIcon from '../assets/icons/skills/backend/Java.png';

// Database
import sqliteIcon from '../assets/icons/skills/database/SQLite.png';
import mysqlIcon from '../assets/icons/skills/database/MySQL.png';

// Tools
import figmaIcon from '../assets/icons/skills/tools/Figma.png';
import vscodeIcon from '../assets/icons/skills/tools/Visual_Studio_Code.png';
import godotengineIcon from '../assets/icons/skills/tools/Godot_Engine.png';
import gitIcon from '../assets/icons/skills/tools/Git.png';
import githubIcon from '../assets/icons/skills/tools/Github.png';

// ── Project screenshots ──
import tipAirlines1 from '../assets/projects_screenshots/tip_airlines/TIP_Airlines.webp';
import tipAirlines2 from '../assets/projects_screenshots/tip_airlines/TIP_Airlines1.webp';
import tipAirlines3 from '../assets/projects_screenshots/tip_airlines/TIP_Airlines2.webp';
import tipAirlines4 from '../assets/projects_screenshots/tip_airlines/TIP_Airlines3.webp';

import pastryShopManagementSystem1 from '../assets/projects_screenshots/pastry_shop_management_system/Pastry_Shop_Management_System.webp';
import pastryShopManagementSystem2 from '../assets/projects_screenshots/pastry_shop_management_system/Pastry_Shop_Management_System1.webp';
import pastryShopManagementSystem3 from '../assets/projects_screenshots/pastry_shop_management_system/Pastry_Shop_Management_System2.webp';
import pastryShopManagementSystem4 from '../assets/projects_screenshots/pastry_shop_management_system/Pastry_Shop_Management_System3.webp';

import earthArcade1 from '../assets/projects_screenshots/earth_arcade/Earth_Arcade.webp';
import earthArcade2 from '../assets/projects_screenshots/earth_arcade/Earth_Arcade1.webp';
import earthArcade3 from '../assets/projects_screenshots/earth_arcade/Earth_Arcade2.webp';
import earthArcade4 from '../assets/projects_screenshots/earth_arcade/Earth_Arcade3.webp';
import earthArcade5 from '../assets/projects_screenshots/earth_arcade/Earth_Arcade4.webp';

import quarto1 from '../assets/projects_screenshots/quarto/Quarto.webp';
import quarto2 from '../assets/projects_screenshots/quarto/Quarto1.webp';
import quarto3 from '../assets/projects_screenshots/quarto/Quarto2.webp';
import quarto4 from '../assets/projects_screenshots/quarto/Quarto3.webp';
import quarto5 from '../assets/projects_screenshots/quarto/Quarto4.webp';
import quarto6 from '../assets/projects_screenshots/quarto/Quarto5.webp';
import quarto7 from '../assets/projects_screenshots/quarto/Quarto6.webp';
import quarto8 from '../assets/projects_screenshots/quarto/Quarto7.webp';

export const STATUS_COLORS = {
    Complete: '#22c55e',
    In_Progress: '#eab308',
    Paused: '#ef4444',
};

export const PROJECTS = [
    {
        id: '01',
        name: 'TIP_AIRLINES',
        status: 'Complete',
        shortDesc:
            `A desktop airline reservation and management system built with
    Python and Tkinter. Features passenger booking, flight scheduling,
    and administrative controls.`,
        fullDesc: [
            `TIP Airlines is a comprehensive desktop application built for
    managing airline operations. The system provides an intuitive
    graphical interface for both passengers and administrators,
    streamlining the entire flight reservation workflow.`,
            `Built with Python and Tkinter, the application features real-time
    seat availability tracking, passenger booking management, flight
    schedule administration, and automated ticket generation. The
    system handles concurrent bookings with data integrity and
    provides detailed reporting for operational analytics.`,
        ],
        stack: ['Python', 'Tkinter', 'SQLite'],
        tools: [
            { name: 'Python', icon: pythonIcon },
            { name: 'Tkinter', icon: tkinterIcon },
            { name: 'Visual Studio Code', icon: vscodeIcon },
            { name: 'SQLite', icon: sqliteIcon },
            { name: 'Git', icon: gitIcon },
            { name: 'Github', icon: githubIcon },
        ],
        role: 'Full-Stack Developer',
        github: {
            isPublic: false,
            url: 'https://github.com/FlimsyOwl12/Project_CompProg_DataBase.git',
        },
        projectURL: '',
        images: [
            tipAirlines2,
            tipAirlines3,
            tipAirlines4,
            tipAirlines1,
        ],
        imageCount: 4,
    },
    {
        id: '02',
        name: 'PASTRY_SHOP_MANAGEMENT_SYSTEM',
        status: 'Complete',
        shortDesc:
            `An advanced Object-Oriented Programming (OOP) simulation of a retail management environment, 
        developed as a final academic requirement to demonstrate proficiency in Java GUI design, 
        relational database integration, and architectural data modeling.`,
        fullDesc: [
            `The Pastry Shop Management System was developed as a final-term project for Object-Oriented Programming to simulate a real-world commercial ecosystem. 
        Built with Java and MySQL, the project served as a technical sandbox to apply core OOP principles—such as encapsulation for data security and modular class structures for system scalability. 
        The application manages complex relationships between product inventory, customer transactions, and administrative oversight through a robust JDBC backend.`,
            `Beyond core CRUD functionality, the simulation features integrated data visualization via the XChart library to track operational performance and sales trends. 
        As the Front-End Developer, I focused on creating an interface that prioritized user experience. Although developed as an academic output, 
        the project represents a deep dive into building stable, multi-layered software architectures that bridge the gap between classroom theory and industry-standard applications.`,
        ],
        stack: ['Java', 'MySQL'],
        tools: [
            { name: 'Java', icon: javaIcon },
            { name: 'Visual Studio Code', icon: vscodeIcon },
            { name: 'MySQL', icon: mysqlIcon },
            { name: 'Git', icon: gitIcon },
            { name: 'Github', icon: githubIcon },
            { name: 'Figma', icon: figmaIcon },
        ],
        role: 'Front-End Developer',
        github: {
            isPublic: false,
            url: null,
        },
        projectURL: '',
        images: [
            pastryShopManagementSystem1,
            pastryShopManagementSystem2,
            pastryShopManagementSystem3,
            pastryShopManagementSystem4,
        ],
        imageCount: 4,
    },
    {
        id: '03',
        name: 'EARTH_ARCADE',
        status: 'Complete',
        shortDesc:
            `Earth arcade is a 2D progressive arcade game experience that combines all the fun mini-games with lessons in environmental awareness.`,
        fullDesc: [
            `A 2D progressive arcade game experience that combines all the fun mini-games with lessons in environmental awareness. Players enter the game and progress through levels, 
            each representing a simple eco-friendly action such as throwing trash properly, and planting trees.`,
            `By tying gameplay to real-world habits, the game promotes sustainability and healthy practices in an engaging way. The progressive design keeps players motivated 
            while reinforcing the message that small actions, when continued over time, can make a big difference for health, wellbeing, and the planet.`,
        ],
        stack: ['Godot Engine', 'Git', 'Github'],
        tools: [
            { name: 'Godot Engine', icon: godotengineIcon },
            { name: 'Git', icon: gitIcon },
            { name: 'Github', icon: githubIcon },
        ],
        role: 'Full-Stack Developer',
        github: {
            isPublic: true,
            url: 'https://github.com/FlimsyOwl12/GAME-ON-Hackathon-Earth-Arcade.git',
        },
        projectURL: '',
        images: [
            earthArcade1,
            earthArcade2,
            earthArcade3,
            earthArcade4,
            earthArcade5,
        ],
        imageCount: 5,
    },
    {
        id: '04',
        name: 'QUARTO',
        status: 'Complete',
        shortDesc:
            `A modern, intuitive web application designed to streamline the management of boarding houses.`,
        fullDesc: [
            `A modern, intuitive web application designed to streamline the management of boarding houses. Quarto provides comprehensive tools for 
            administrators and tenants to efficiently manage rooms, payments, tenants, and maintenance requests.`,
            `Quarto is a lightweight, modern system designed to simplify daily operations in apartments, boarding houses, and lodging establishments. 
            Quarto helps you maintain efficiency, control, and organization whether you're managing a residential property or a complex of apartments.`,
        ],
        stack: ['HTML', 'CSS', 'JavaScript', 'Python', 'Git', 'Github'],
        tools: [
            { name: 'HTML', icon: html5Icon },
            { name: 'CSS', icon: css3Icon },
            { name: 'JavaScript', icon: jsIcon },
            { name: 'Python', icon: pythonIcon },
            { name: 'Git', icon: gitIcon },
            { name: 'Github', icon: githubIcon },
        ],
        role: 'Full-Stack Developer',
        github: {
            isPublic: false,
            url: 'https://github.com/Cocoasaur/Quarto.git',
        },
        projectURL: 'https://quarto-4d613.web.app',
        images: [
            quarto1,
            quarto2,
            quarto3,
            quarto4,
            quarto5,
            quarto6,
            quarto7,
            quarto8,
        ],
        imageCount: 8,
    },

];