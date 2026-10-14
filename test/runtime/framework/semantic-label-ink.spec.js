import { expect, test } from '@playwright/test';
import { frameworkBundleFile, readBuild } from '../../support/processed-bundle.js';

const LABELS = ['primary', 'success', 'error', 'warning'];

async function labelInks(page, screenClasses) {
  await page.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <link rel="stylesheet" href="/__semantic-label-ink__/plugins.css">
      <style>.screen { visibility: visible }</style>
    </head><body class="environment trmnl">
      <div class="screen ${screenClasses}">
        ${LABELS.map((name) => `<span class="label label--${name}">${name}</span>`).join('')}
      </div>
    </body></html>`);

  return page.evaluate(() => [...document.querySelectorAll('.label')].map((label) => {
    const style = getComputedStyle(label);
    return { ink: style.color, ground: style.backgroundColor };
  }));
}

test.describe('semantic label ink', () => {
  test.beforeEach(async ({ page }) => {
    const bundle = await readBuild(frameworkBundleFile());
    await page.route('**/__semantic-label-ink__/plugins.css', (route) => route.fulfill({
      body: bundle,
      contentType: 'text/css',
    }));
    await page.goto('/framework/test/runtime');
  });

  for (const rail of ['screen--color-full', 'screen--color-6a']) {
    test(`dark mode keeps label ink on ${rail}, where hues hold still`, async ({ page }) => {
      const light = await labelInks(page, rail);

      expect(await labelInks(page, `${rail} screen--dark-mode`)).toEqual(light);
    });
  }

  test('dark mode still flips label ink on a gray rail, where the ground mirrors with it', async ({ page }) => {
    const light = await labelInks(page, 'screen--4bit');
    const dark = await labelInks(page, 'screen--4bit screen--dark-mode');

    expect(dark.map(({ ink }) => ink)).not.toEqual(light.map(({ ink }) => ink));
  });
});
