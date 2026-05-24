import { useTheme } from '../../context/ThemeContext';

const THEME_LABELS = {
    'demain-soir-bleu': 'DEMAIN_SOIR_BLEU',
    'clair-obscur': 'CLAIR_OBSCUR',
};

export default function ThemeLabel() {
    const { theme } = useTheme();

    return (
        <div className="fixed top-10 right-12 z-40 hidden md:block theme-label-entrance">
            <span
                className="font-mono text-[10px] tracking-[0.3em] uppercase"
                style={{
                    fontFamily: "'Space Grotesk', monospace",
                    color: 'var(--void-text-muted)',
                }}
            >
                Theme: {THEME_LABELS[theme] || theme.toUpperCase()}
            </span>
        </div>
    );
}