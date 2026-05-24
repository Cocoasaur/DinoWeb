export default function CornerMarkers() {
    const base = "fixed w-10 h-5 border pointer-events-none z-50 corner-markers-entrance";
    const style = { borderColor: 'var(--void-marker)' };
    return (
        <>
            <div className={`${base} top-10 left-10 border-r-0 border-b-0`} style={style} />
            <div className={`${base} top-10 right-10 border-l-0 border-b-0`} style={style} />
            <div className={`${base} bottom-10 left-10 border-r-0 border-t-0`} style={style} />
            <div className={`${base} bottom-10 right-10 border-l-0 border-t-0`} style={style} />
        </>
    );
}