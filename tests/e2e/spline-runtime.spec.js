import { expect, test } from '@playwright/test';
import process from 'node:process';

// A controlled API fixture tests the React/runtime boundary, not Spline's
// rendering or the yet-to-be-authored scene. Run against the configured dev
// server documented in docs/spline-interactive-prototype.md.
const configuredUrl = process.env.PLAYWRIGHT_SPLINE_URL;
test.skip(!configuredUrl, 'Requires a configured Spline dev server; see prototype docs.');
const fixture = `
export class Application {
    constructor(canvas) {
        this.canvas = canvas; this.listeners = {}; this.id = (window.splineSequence = (window.splineSequence || 0) + 1);
        this.variables = { DinoWeb_Theme: 'clair-obscur' };
        window.splineApplications = [...(window.splineApplications || []), this];
        window.activeSpline = this;
        canvas.addEventListener('pointerup', () => this.listeners.mouseUp?.({ target: { name: 'DinoWeb_Panel_Skills' } }));
    }
    async load() {
        if (window.fixtureMode === 'fail') throw new Error('Scene fetch failed');
        if (window.fixtureMode === 'hang') await new Promise(() => {});
    }
    setSize(width, height) { this.size = [width, height]; }
    getVariables() { return this.variables; }
    setVariable(name, value) { this.variables[name] = value; }
    addEventListener(name, cb) { this.listeners[name] = cb; }
    removeEventListener(name) { delete this.listeners[name]; }
    stop() { this.stopped = true; }
    play() { this.stopped = false; }
    dispose() { this.disposed = true; }
}`;

test.use({ serviceWorkers: 'block', viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true });
test.beforeEach(async ({ page }) => {
    await page.route('**/node_modules/.vite/deps/@splinetool_runtime.js*', route => route.fulfill({ contentType: 'application/javascript', body: fixture }));
});

test('pauses without recreating the scene and distinguishes taps from drags', async ({ page }) => {
    await page.goto(configuredUrl);
    const scene = page.locator('.spline-scene');
    await expect(scene).toHaveAttribute('data-scene-status', 'ready');
    const count = await page.evaluate(() => window.splineSequence);
    await page.getByRole('button', { name: 'Pause scene', exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.activeSpline.stopped)).toBe(true);
    await page.getByRole('button', { name: 'Resume scene', exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.activeSpline.stopped)).toBe(false);
    await page.getByRole('button', { name: 'Demain soir bleu', exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.activeSpline.variables.DinoWeb_Theme)).toBe('demain-soir-bleu');
    const box = await scene.boundingBox();
    await page.mouse.move(box.x + 50, box.y + 50);
    await page.mouse.down();
    await page.mouse.move(box.x + 120, box.y + 50, { steps: 10 });
    await page.mouse.up();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await scene.locator('canvas').tap();
    await expect(page.getByRole('dialog', { name: 'skills details' })).toHaveAttribute('data-phase', 'open');
    await expect.poll(() => page.evaluate(() => window.activeSpline.stopped)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => window.activeSpline.stopped)).toBe(false);
    expect(await page.evaluate(() => window.splineSequence)).toBe(count);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => window.activeSpline.size[0])).toBeLessThan(390);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(scene).toHaveCount(0);
    expect(await page.evaluate(() => window.splineApplications.every(app => app.disposed))).toBe(true);
    await expect(page.getByRole('status')).toContainText('Explore at your own pace.');
});

test('handles a rejected load and lets the visitor retry', async ({ page }) => {
    await page.addInitScript(() => { window.fixtureMode = 'fail'; });
    await page.goto(configuredUrl);
    await expect(page.getByRole('alert')).toContainText('The scene couldn’t load.');
    expect(await page.evaluate(() => window.splineApplications.every(app => app.disposed))).toBe(true);
    await page.evaluate(() => { window.fixtureMode = 'ready'; });
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.locator('.spline-scene')).toHaveAttribute('data-scene-status', 'ready');
});

test('bounds a stalled scene load with a usable fallback', async ({ page }) => {
    await page.addInitScript(() => { window.fixtureMode = 'hang'; });
    await page.clock.install();
    await page.goto(configuredUrl);
    await expect.poll(() => page.evaluate(() => window.splineSequence)).toBeGreaterThan(0);
    await page.clock.fastForward(26000);
    await expect(page.getByRole('alert')).toContainText('The scene couldn’t load.');
    expect(await page.evaluate(() => window.splineApplications.every(app => app.disposed))).toBe(true);
    await expect(page.getByRole('navigation', { name: 'Portfolio pages' })).toBeVisible();
});


test('reports a failed scene fetch through the actual Spline runtime', async ({ page }) => {
    test.setTimeout(45000);
    await page.unroute('**/node_modules/.vite/deps/@splinetool_runtime.js*');
    await page.route('**/*.splinecode', route => route.abort('failed'));
    await page.goto(configuredUrl);
    await expect(page.getByRole('alert')).toContainText('The scene couldn’t load.', { timeout: 30000 });
    await expect(page.getByRole('navigation', { name: 'Portfolio pages' })).toBeVisible();
});
