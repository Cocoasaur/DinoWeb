export const CONTENT_DATA = {
    home: "Welcome to the ARCHIVE_SYSTEM. Initialize sequence to proceed.",
    about: "Entity classification: Designer / Developer. Operating parameters: Creative problem solving.",
    skills: "React, Node.js, Three.js, TailwindCSS, TypeScript, Python.",
    projects: "01_NEURAL_NET\n02_VOID_UI\n03_QUANTUM_DASH",
    contacts: "Transmit signals to: comms@archivesystem.net",
    theme: "Toggle display mode."
};

export const FACE_CONFIG = [
    { name: 'home', position: [0, 0, 1.01], rotation: [0, 0, 0], text: '' },
    { name: 'projects', position: [1.01, 0, 0], rotation: [0, Math.PI / 2, 0], text: 'Projects' },
    { name: 'contacts', position: [0, 0, -1.01], rotation: [0, Math.PI, 0], text: 'Contacts' },
    { name: 'skills', position: [-1.01, 0, 0], rotation: [0, -Math.PI / 2, 0], text: 'Skills' },
    { name: 'about', position: [0, 1.01, 0], rotation: [-Math.PI / 2, 0, 0], text: 'About' },
    { name: 'theme', position: [0, -1.01, 0], rotation: [Math.PI / 2, 0, 0], text: 'Theme' },
];

export const FACE_ROTATIONS = {
    home: { x: 0, y: 0 },
    projects: { x: 0, y: -90 },
    contacts: { x: 0, y: 180 },
    skills: { x: 0, y: 90 },
    about: { x: 90, y: 0 },
    theme: { x: -90, y: 0 },
};

export const DRAG_THRESHOLD = 5; // Minimum drag distance to trigger rotation
export const ZOOM_MIN = -160; // Minimum zoom distance (closest to camera)
export const ZOOM_MAX = 260; // Maximum zoom distance (farthest from camera)
export const DEFAULT_ROTATION = { x: -20, y: -45 }; // Initial resting rotation of the cube
export const ZOOM_CAMERA_DISTANCE = 2.5;
export const DEFAULT_CAMERA_DISTANCE = 5;

// ─── Layout ──────────────────────────────────────────────────
export const CUBE_OFFSET_X = 1.6;   // resting position: cube right of center
export const CUBE_CENTER_X = 0.0;   // zoomed position: cube at center