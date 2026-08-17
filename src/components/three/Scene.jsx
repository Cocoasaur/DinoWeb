import React from 'react';
import InteractiveCube from './InteractiveCube';
import Stage from './Stage';

export default function Scene(props) {
    return (
        <>
            <ambientLight intensity={0.2} />
            <directionalLight position={[3, 4, 5]} intensity={1.2} color="#ffffff" />
            <directionalLight position={[-3, -2, -4]} intensity={0.5} color="#e2e2e2" />
            <directionalLight position={[0, -4, 2]} intensity={0.4} color="#ffffff" />
            <Stage
                isLowEnd={props.isLowEnd}
                isZoomed={props.isZoomed}
                isZoomingOut={props.isZoomingOut}
                isDraggingRef={props.isDraggingRef}
            />
            <InteractiveCube {...props} />
        </>
    );
}