export default function RotatePrompt({ label = 'ROTATE THE CUBE' }) {
    return (
        <div className="rotate-prompt rotate-prompt-entrance">
            <div className="rotate-prompt__dot" />
            <div className="rotate-prompt__line" />
            <span className="rotate-prompt__label">{label}</span>
        </div>
    );
}
