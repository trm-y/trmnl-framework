import { expect, test } from '@playwright/test';
import { mountFixture, openRuntimePage } from '../support/runtime-page.js';

for (const [screenName, deviceClasses] of [['TRMNL OG', []], ['TRMNL X', ['screen--v2']]]) {
  for (const [bleedName, bleedClasses] of [['bleed', []], ['no-bleed', ['screen--no-bleed']]]) {
    test(`keeps the full view's title bar at its own height on ${screenName} with ${bleedName}`, async ({ page }) => {
      await openRuntimePage(page);
      await mountFixture(page, {
        html: '<div class="view view--full"><div class="layout"><span class="title">Content</span></div><div class="title_bar"><span class="title">Title</span></div></div>',
        css: '.screen { --pixel-ratio: 1 !important; }',
        screenClasses: [...deviceClasses, ...bleedClasses],
      });

      const result = await page.locator('.title_bar').evaluate((titleBar) => {
        const probe = titleBar.parentElement.appendChild(document.createElement('div'));
        probe.style.cssText = 'position: absolute; height: var(--title-bar-height);';
        return { height: titleBar.getBoundingClientRect().height, expected: probe.getBoundingClientRect().height };
      });
      expect(result.height).toBeCloseTo(result.expected, 1);
    });
  }
}
