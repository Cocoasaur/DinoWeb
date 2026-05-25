import { useTheme } from '../../context/ThemeContext';

const THEME_LABELS = {
    'demain-soir-bleu': 'DEMAIN_SOIR_BLEU',
    'clair-obscur': 'CLAIR_OBSCUR',
};

export default function ThemeLabel() {
    const { theme } = useTheme();

    return (
        <div className="home-theme-label theme-label-entrance">
            <span className="home-theme-label__value">
                THEME: {THEME_LABELS[theme] || theme.toUpperCase()}
            </span>
        </div>
    );
}
