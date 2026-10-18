# Clair Obscur — monochrome

The theme uses neutral light gray `#F2F2F2`, white `#FFFFFF`, near-black
`#141414`, secondary gray `#626262`, and charcoal accents `#343434`.
Selected controls use `#242424` with white labels. Grids, markers, progress,
scrollbars, and contribution intensity levels all use grayscale. Photographs,
certificates, technology logos, and the dinosaur retain their original artwork.
The alternate blue theme keeps its own color palette.

`src/index.css` defines the palette. The HTML/PWA startup colors and recovery
screen fallback match the light background. Cube label atlases are pre-rendered;
after changing their colors run:

```sh
CHROME_PATH=/usr/bin/google-chrome-stable node scripts/generate-cube-labels.mjs
```

The cube uses graphite `#484848`, white lettering, and gray corner details.
`src/utils/cubeSurface.js` caches a subtle neutral grain texture, with no bright
marble veins or brightness multiplier. Removing the previous 6× multiplier
prevents amplified baked highlights from washing out near-front-facing faces.
A softer `#242424` specular and shared shininess keep highlights restrained.
Both worker and React fallback renderers use this material; reduced profiles
bake the same lighting into vertices. The circular theme shader switches the
texture along with the palette without extra draw calls.

Validation: production build, targeted ESLint, cube theme transitions,
mobile/desktop lighting comparisons, About-page animation/scroll regressions,
and the custom cursor suite. Inspect homepage and About screenshots, including
a narrow portrait window with a nearly front-facing cube. If the preview's
service worker offers a new version, accept its Reload prompt.
