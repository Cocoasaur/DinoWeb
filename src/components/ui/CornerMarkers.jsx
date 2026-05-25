export default function CornerMarkers() {
    const base = "corner-marker corner-markers-entrance";
    const style = { borderColor: 'var(--void-marker)' };

    return (
        <>
            <div className={`${base} corner-marker--top-left`} style={style} />
            <div className={`${base} corner-marker--top-right`} style={style} />
            <div className={`${base} corner-marker--bottom-left`} style={style} />
            <div className={`${base} corner-marker--bottom-right`} style={style} />
        </>
    );
}
