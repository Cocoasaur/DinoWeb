function Background() {
    return (
        <div
            aria-hidden="true"
            className="fixed inset-0 pointer-events-none z-0"
            style={{
                backgroundImage: `
          linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
        `,
                backgroundSize: '100px 100px',
                animation: 'drift 60s linear infinite',
                opacity: 0.5,
            }}
        />
    )
}

export default Background