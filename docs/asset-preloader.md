# Portfolio asset preloader

The HTML boot shell has inline critical styling so it is centered and covers the viewport before the application module or external styles arrive. React keeps that shell in place until both the asset queue and the cube’s first frame are ready. Homepage motion and input begin after readiness. The loader and homepage use the same paused floor tiles and projection; floor transform transitions stay disabled until readiness to prevent a reload tilt or grid jump.

The production build embeds its exact local asset list into HTML. The queue loads page modules, secondary styles, images, fonts, and shipped documents, with six concurrent tasks. Image completion includes decoding; font completion includes the browser font readiness promise. Progress reports completed tasks rather than elapsed time. Cached loads can finish quickly without an artificial delay.

Failed downloads keep the loader visible with retry and an explicit option to continue with available assets. Each task has a 30-second deadline; successful tasks are retained for retries. Service-worker registration follows readiness. Optional Spline experiment files and live third-party data are outside the normal portfolio preload.

## Verification — 25 October 2026

- Production build and targeted ESLint checks passed.
- Six browser checks cover immediate HTML styling on desktop and phone, delayed documents, delayed fonts, failed-download retry, and three repeated reloads. Every asset in the build manifest completes before reveal.
- Thirteen integration checks passed for Projects navigation, the separate Spline experiment, and grid separation in both themes across desktop, tablet, and phone sizes.

These checks validate readiness and the refresh flash; they are not Lighthouse performance measurements.
