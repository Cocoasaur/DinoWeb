import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

for (const profile of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'phone', width: 390, height: 844, touch: true },
    { name: 'portrait tablet', width: 820, height: 1180, touch: true, reduced: true },
]) test.describe(`Spline prototype: ${profile.name}`, () => {
    test.use({ viewport: { width: profile.width, height: profile.height }, hasTouch: !!profile.touch,
        isMobile: !!profile.touch, reducedMotion: profile.reduced ? 'reduce' : 'no-preference' });
    test('keeps pages accessible before connecting a scene', async ({ page }, testInfo) => {
        const errors = [];
        const requests = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('request', request => requests.push(request.url()));
        await page.goto('./?prototype=spline');
        await expect(page.locator('.boot-screen')).toHaveCount(0);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('A new dimension.');
        await expect(page.getByRole('status')).toContainText(profile.reduced ? 'Explore at your own pace.' : 'Your scene goes here.');
        await expect(page.locator('canvas')).toHaveCount(0);
        await expect(page.locator('main')).toHaveCSS('overflow-y', 'auto');
        expect(requests.some(url => /\/spline\/runtime|CubeStage|cube-worker/.test(url))).toBe(false);
        await page.getByRole('button', { name: 'Demain soir bleu', exact: true }).click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'demain-soir-bleu');
        await expect.poll(() => page.locator('main').evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
        await page.screenshot({ path: testInfo.outputPath('spline-prototype.png') });
        for (const [label, destination] of [['Skills', 'skills'], ['Projects', 'projects'], ['Contact', 'contacts'], ['About', 'about']]) {
            const button = page.getByRole('navigation', { name: 'Portfolio pages' }).getByRole('button', { name: new RegExp(label) });
            if (profile.touch) await button.tap();
            else { await button.focus(); await page.keyboard.press('Enter'); }
            const dialog = page.getByRole('dialog', { name: `${destination} details` });
            await expect(dialog).toHaveAttribute('data-phase', 'open', { timeout: 15000 });
            await expect(page.getByRole('button', { name: `Close ${destination} details` })).toBeFocused();
            await page.keyboard.press('Shift+Tab');
            expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
            await page.keyboard.press('Escape');
            await expect(dialog).toHaveCount(0);
            await expect(button).toBeFocused();
        }
        expect(errors).toEqual([]);
        await page.getByRole('link', { name: /Back to portfolio/ }).click();
        await expect(page).not.toHaveURL(/prototype=spline/);
        await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 });
        await expect(page.locator('.cube-entrance')).toBeVisible();
    });
});

test('normal homepage never requests the experimental renderer', async ({ page }) => {
    const requests = [];
    page.on('request', request => requests.push(request.url()));
    await page.goto('./');
    await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 });
    await page.waitForTimeout(6000);
    expect(requests.some(url => url.includes('/assets/spline/'))).toBe(false);
    await expect(page.locator('.spline-prototype')).toHaveCount(0);
});
