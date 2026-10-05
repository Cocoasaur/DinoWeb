import { createContext, useContext } from 'react';

export const RenderProfileContext = createContext({ reduceEffects: true });
export function useRenderProfile() {
    return useContext(RenderProfileContext);
}
