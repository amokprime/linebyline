---
model: GLM-5.1
---
Read contents of linebyline.zip for context, starting with INDEX.md (/linebyline parent folder represents repo root). I want to capture the Settings window body `locator('#settings-body')` in a single screenshot even though it takes 14 ticks of scrolling up or down to see it all.

---
Now let me look at the Settings section of the app HTML and the existing test prompts for context:
Now let me read the Settings JS section to understand `openSettings` and the scroll behavior:
Now I have full context. Let me read the CSS for the settings window dimensions to nail down the exact expansion strategy:
Now I have everything I need. Here's the complete analysis and solution:

---

## The Layout Problem

`#settings-body` is the scrollable pane inside a constrained flex layout:

```
#settings-win          → max-height:88vh; overflow:hidden;  flex-column
  #settings-title-bar  → flex-shrink:0 (fixed)
  #settings-body       → overflow-y:auto; flex:1  ← THIS scrolls, ~14 ticks
  #settings-footer     → (reset/confirm buttons)
```

`#settings-body` can never show all its content at once because:
1. **`#settings-win`** has `max-height:88vh` and `overflow:hidden` — clips everything beyond 88vh
2. **`#settings-body`** has `overflow-y:auto` and `flex:1` — it shrinks to fit the win's remaining space and scrolls

## The Solution: Temporarily Expand Before Screenshot

Override both elements' inline styles via `page.evaluate()`, take the screenshot, then close settings (closing the overlay resets visual state anyway — no need to manually restore):

```js
const { test, expect } = require('@linebyline/test-helpers');

test('settings opens with Ctrl+, and full body is capturable in one screenshot', async ({ page, media }) => {
  // Load a file so the app has meaningful state
  await page.locator('#file-picker').setInputFiles([media('plain_english.lrc')]);

  // Open Settings
  await page.keyboard.press('Control+,');
  await expect(page.locator('#settings-overlay')).toHaveClass(/open/);

  // Expand #settings-body to its full scrollHeight by overriding the
  // constraining CSS on both #settings-win and #settings-body.
  // Closing the overlay afterwards hides the visual glitch — no restore needed.
  await page.evaluate(() => {
    const win  = document.getElementById('settings-win');
    const body = document.getElementById('settings-body');
    // Remove the viewport cap and clipping on the window
    win.style.maxHeight = 'none';
    win.style.overflow  = 'visible';
    // Let the body grow to its natural height instead of scrolling
    body.style.overflow = 'visible';
    body.style.flex     = 'none';
  });

  // Single screenshot of the entire settings body — no scrolling needed
  await expect(page.locator('#settings-body')).toHaveScreenshot('settings-full-body.png');

  // Close settings (overlay removal means the expanded styles are invisible)
  await page.keyboard.press('Escape');
  await expect(page.locator('#settings-overlay')).not.toHaveClass(/open/);
});
```

### Why This Works

| Property overridden | Original (stylesheet) | Override (inline) | Effect |
|---|---|---|---|
| `#settings-win` `max-height` | `88vh` | `none` | Window can grow beyond viewport |
| `#settings-win` `overflow` | `hidden` | `visible` | Content past the old cap is rendered, not clipped |
| `#settings-body` `overflow` | `auto` | `visible` | No scrollbar — content renders at full height |
| `#settings-body` `flex` | `1` | `none` | Body sizes to its `scrollHeight` instead of shrinking to fill remaining space |

After `flex: none`, the element's height becomes its natural content height (equivalent to `scrollHeight`), and `overflow: visible` ensures nothing is hidden. The `#settings-win` changes prevent the parent from clipping the now-taller body.

### No Restore Needed

Closing the settings overlay (`Escape` → `closeSettings()`) adds/removes the `.open` class on `#settings-overlay`, setting `display:none`. The inline style overrides remain on the elements but are invisible because the entire overlay is hidden. Next time `openSettings()` runs, it calls `buildHkRows()` which rebuilds the DOM inside `#settings-body`, and the inline overrides persist — which is fine because the next test will re-apply the same expansion technique when it needs a screenshot, or simply not touch styles for non-screenshot tests.

If you'd prefer to be tidy and restore styles after the screenshot, add before closing:

```js
await page.evaluate(() => {
  const win  = document.getElementById('settings-win');
  const body = document.getElementById('settings-body');
  win.style.maxHeight = '';
  win.style.overflow  = '';
  body.style.overflow = '';
  body.style.flex     = '';
});
```

Setting to empty string `''` removes the inline override, and the stylesheet rules take effect again.