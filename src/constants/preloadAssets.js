/* ══════════════════════════════════════════════════════
   PRELOAD MANIFEST
   Every static asset the portfolio can show — images are
   warmed via `new Image()`, non-image files via `fetch()`.
   Importing here is free: Vite dedupes to the same module
   instances already used by the pages/components.
   ══════════════════════════════════════════════════════ */

// ── Brand ──
import dinoIcon from '../assets/brand/dino-icon.png';

// ── Profile ──
import profileImage from '../assets/images/profile/me.webp';

// ── Certifications ──
import aignite from '../assets/certifications/AIgnite.webp';
import courseraExcel from '../assets/certifications/Coursera_Excel.webp';
import courseraExcel1 from '../assets/certifications/Coursera_Excel1.webp';
import zuittCodingBootcamp from '../assets/certifications/ZUITT_Free_Coding_Bootcamp.webp';
import gdgBacolod from '../assets/certifications/GDG_Bacolod.webp';
import googleForEducation from '../assets/certifications/Google_for_Education.webp';
import ciscoIntroDS from '../assets/certifications/Cisco_Data_Science.webp';

// ── Resume ──
import resumePdf from '../assets/resume/Resume_Arquesola.pdf';

// ── GitHub buttons ──
import githubIconLight from '../assets/repoButton/Light-dark_Github.png';
import githubIconDark from '../assets/repoButton/Tomorrow_Night_Blue_Github.png';

// ── Skill icons — Frontend ──
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

// ── Skill icons — Backend ──
import pythonIcon from '../assets/icons/skills/backend/Python.png';
import javaIcon from '../assets/icons/skills/backend/Java.png';
import nodejsIcon from '../assets/icons/skills/backend/Node.js.png';
import firebaseIcon from '../assets/icons/skills/backend/Firebase.png';

// ── Skill icons — Database ──
import sqliteIcon from '../assets/icons/skills/database/SQLite.png';
import mysqlIcon from '../assets/icons/skills/database/MySQL.png';
import firestoreIcon from '../assets/icons/skills/database/Firestore.png';

// ── Skill icons — Tools ──
import figmaIcon from '../assets/icons/skills/tools/Figma.png';
import canvaIcon from '../assets/icons/skills/tools/Canva.png';
import postmanIcon from '../assets/icons/skills/tools/Postman.png';
import vscodeIcon from '../assets/icons/skills/tools/Visual_Studio_Code.png';
import kimiIcon from '../assets/icons/skills/tools/Kimi.png';
import claudeIcon from '../assets/icons/skills/tools/Claude.png';
import godotengineIcon from '../assets/icons/skills/tools/Godot_Engine.png';
import gitIcon from '../assets/icons/skills/tools/Git.png';
import githubIcon from '../assets/icons/skills/tools/Github.png';

// ── Project screenshots — TIP Airlines ──
import tipAirlines1 from '../assets/projects_screenshots/tip_airlines/TIP_Airlines.webp';
import tipAirlines2 from '../assets/projects_screenshots/tip_airlines/TIP_Airlines1.webp';
import tipAirlines3 from '../assets/projects_screenshots/tip_airlines/TIP_Airlines2.webp';
import tipAirlines4 from '../assets/projects_screenshots/tip_airlines/TIP_Airlines3.webp';

// ── Project screenshots — Pastry Shop ──
import pastryShopManagementSystem1 from '../assets/projects_screenshots/pastry_shop_management_system/Pastry_Shop_Management_System.webp';
import pastryShopManagementSystem2 from '../assets/projects_screenshots/pastry_shop_management_system/Pastry_Shop_Management_System1.webp';
import pastryShopManagementSystem3 from '../assets/projects_screenshots/pastry_shop_management_system/Pastry_Shop_Management_System2.webp';
import pastryShopManagementSystem4 from '../assets/projects_screenshots/pastry_shop_management_system/Pastry_Shop_Management_System3.webp';

// ── Project screenshots — Earth Arcade ──
import earthArcade1 from '../assets/projects_screenshots/earth_arcade/Earth_Arcade.webp';
import earthArcade2 from '../assets/projects_screenshots/earth_arcade/Earth_Arcade1.webp';
import earthArcade3 from '../assets/projects_screenshots/earth_arcade/Earth_Arcade2.webp';
import earthArcade4 from '../assets/projects_screenshots/earth_arcade/Earth_Arcade3.webp';
import earthArcade5 from '../assets/projects_screenshots/earth_arcade/Earth_Arcade4.webp';

// ── Project screenshots — Quarto ──
import quarto1 from '../assets/projects_screenshots/quarto/Quarto.webp';
import quarto2 from '../assets/projects_screenshots/quarto/Quarto1.webp';
import quarto3 from '../assets/projects_screenshots/quarto/Quarto2.webp';
import quarto4 from '../assets/projects_screenshots/quarto/Quarto3.webp';
import quarto5 from '../assets/projects_screenshots/quarto/Quarto4.webp';
import quarto6 from '../assets/projects_screenshots/quarto/Quarto5.webp';
import quarto7 from '../assets/projects_screenshots/quarto/Quarto6.webp';
import quarto8 from '../assets/projects_screenshots/quarto/Quarto7.webp';

export const PRELOAD_IMAGES = [
    dinoIcon,
    profileImage,
    aignite,
    courseraExcel,
    courseraExcel1,
    zuittCodingBootcamp,
    gdgBacolod,
    googleForEducation,
    ciscoIntroDS,
    githubIconLight,
    githubIconDark,
    html5Icon,
    css3Icon,
    jsIcon,
    tsIcon,
    tailwindIcon,
    tkinterIcon,
    reactIcon,
    threejsBlackIcon,
    threejsWhiteIcon,
    viteIcon,
    pythonIcon,
    javaIcon,
    nodejsIcon,
    firebaseIcon,
    sqliteIcon,
    mysqlIcon,
    firestoreIcon,
    figmaIcon,
    canvaIcon,
    postmanIcon,
    vscodeIcon,
    kimiIcon,
    claudeIcon,
    godotengineIcon,
    gitIcon,
    githubIcon,
    tipAirlines1,
    tipAirlines2,
    tipAirlines3,
    tipAirlines4,
    pastryShopManagementSystem1,
    pastryShopManagementSystem2,
    pastryShopManagementSystem3,
    pastryShopManagementSystem4,
    earthArcade1,
    earthArcade2,
    earthArcade3,
    earthArcade4,
    earthArcade5,
    quarto1,
    quarto2,
    quarto3,
    quarto4,
    quarto5,
    quarto6,
    quarto7,
    quarto8,
];

export const PRELOAD_FILES = [
    resumePdf,
];

export const PRELOAD_TOTAL = PRELOAD_IMAGES.length + PRELOAD_FILES.length;