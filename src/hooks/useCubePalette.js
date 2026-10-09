import { useTheme } from '../context/ThemeContext';

// The live canvas keeps one complete palette while the page's snapshot wipes.
// Sharing these values also avoids a CSS observer for each fallback cube face.
export function useCubePalette() {
    return useTheme().cubePalette;
}
