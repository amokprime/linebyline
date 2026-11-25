import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Returns the URL path to the main app entry point — always "/" since
 * Phase E Tranche 6: the pre-cutover monolith target (`/docs/index.html`
 * served by `npx serve . -l 3004`) and its `LBL_VITE_TARGET` env-var branch
 * are gone with docs/index.html. Vite preview is the only target, and
 * Playwright's `baseURL` points at the preview server.
 */
export function getAppUrl() {
  return "/";
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MEDIA_DIR = path.join(HERE, "..", "media");

/**
 * Custom fixtures. `workaroundPaste` is an auto-setup fixture: destructure as
 * `{ workaroundPaste: _workaroundPaste }` — the underscore prefix silences
 * the "declared but never read" (TS6133) warning, since the fixture has no
 * value, its presence only triggers setup.
 */
type Fixtures = {
  media: (filename: string) => string;
  readMedia: (filename: string) => string;
  importSecondary: (nth: number, filename: string) => Promise<void>;
  workaroundPaste: void;
};

const test = base.extend<Fixtures>({
  page: async ({ page }, use) => {
    await page.goto(getAppUrl());
    await use(page);
  },
  media: async ({}, use) => {
    await use((filename: string) => path.join(MEDIA_DIR, filename));
  },
  readMedia: async ({}, use) => {
    await use((_filename: string) =>
      readFileSync(path.join(MEDIA_DIR, _filename), "utf-8"),
    );
  },
  importSecondary: async ({ page, media }, use) => {
    await use(async (nth: number, filename: string) => {
      const [fc] = await Promise.all([
        page.waitForEvent("filechooser"),
        page
          .getByRole("button", { name: "Import secondary lyrics file" })
          .nth(nth - 1)
          .click(),
      ]);
      await fc.setFiles([media(filename)]);
      // Use getByRole('textbox') — getByLabel('Secondary N lyrics')
      // also matches the file input ('Secondary N lyrics file').
      await expect(
        page.getByRole("textbox", { name: `Secondary ${nth} lyrics` }),
      ).toHaveValue(/./);
    });
  },
  // Auto-setup fixture: include `workaroundPaste` in a test's destructured
  // args to (1) skip the test on webkit and (2) grant clipboard-read/write
  // permissions on chromium. See the Fixtures type above for details.
  workaroundPaste: async ({ context, browserName }, use) => {
    test.skip(
      browserName === "webkit",
      "Webkit always generates empty snapshot from Control+V paste",
    );
    if (browserName === "chromium") {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    }
    await use();
  },
});

/**
 * Press Tab repeatedly until the element matching the selector receives focus.
 */
export async function tabUntilFocused(
  page: Page,
  selector: string,
  options: { index?: number; maxTabs?: number } = {},
) {
  const { index = 0, maxTabs = 50 } = options;
  const locator = page.locator(selector).nth(index);
  for (let i = 0; i < maxTabs; i++) {
    if (
      await locator.evaluate(
        (el: Element) => el === document.activeElement,
      )
    )
      return;
    await page.keyboard.press("Tab");
  }
  throw new Error(
    `tabUntilFocused: ${selector}[${index}] not focused after ${maxTabs} Tabs`,
  );
}

/** Wait for lyrics import to settle (active line rendered). */
export async function waitForLyrics(page: Page) {
  await expect(page.locator(".lrc-line.cursor")).toBeVisible();
}

/** Wait for audio metadata to load (duration no longer 0:00). */
export async function waitForAudio(page: Page) {
  await expect(page.locator("#time-dur")).not.toHaveText("0:00");
}

/** Wait for both lyrics and audio import to settle. */
export async function waitForImport(page: Page) {
  await waitForLyrics(page);
  await waitForAudio(page);
}

/**
 * Dispatch a synthetic cancelable beforeunload event and report whether the
 * app's own handler called preventDefault (observed via `defaultPrevented`
 * after the synchronous dispatch). Headless chromium suppresses the real
 * dialog, so this is the mechanism-level pin for the dirty-warning behavior.
 *
 * The observer must NOT call preventDefault itself and must not register a
 * listener: a self-preventing handler would flip defaultPrevented and the
 * assertion would observe its own side effect instead of the app's listener
 * (the Tranche 9 mutation test caught exactly that in the pre-helper inline
 * pattern — deleting App.vue's listener registration let the old test pass).
 */
export async function beforeUnloadPrevented(page: Page) {
  return page.evaluate(() => {
    const ev = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(ev);
    return ev.defaultPrevented;
  });
}

export { test, expect };
