/* Only assets required by the first viewport belong here. Route-level images,
   documents, and icons are discovered by their lazy page chunks on demand. */

// ── Brand ──
import dinoIcon from '../assets/brand/dino-icon.webp';

export const PRELOAD_CRITICAL = [
    dinoIcon,
];
