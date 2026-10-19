---
model: DeepSeek
---
In Playwright, is there a conventional way to test "it's been a while, elements did not change state (implying something not allowed happened)" that works for all three browsers, in both headless and UI mode?

---
Ah, my apologies! I provided the previous response in Chinese, but your question was in English. Let me give you the complete answer in English right now.

---

In Playwright, there isn't a single built-in method like `toBeUnchanged`, but the conventional and robust way to test that "an element's state hasn't changed over a period of time" is by **combining Playwright's auto-retrying assertions with `expect.poll()`** or `page.waitForFunction()`. 

These methods work identically across Chromium, Firefox, and WebKit, in both headless and UI modes, because they rely on Playwright's core waiting mechanics rather than GUI rendering.

Here are the two most reliable approaches:

### Method 1: Using `expect.poll()` with `toEqual` (Most Recommended)

This is the most "web-first" and idiomatic way. `expect.poll()` repeatedly calls an async function until its return value satisfies the assertion or the timeout is reached. 

You can use it to poll the current state of an element (text, attribute, class list, etc.) and assert that it remains strictly equal to the initial state for a specified duration.

```javascript
import { test, expect } from '@playwright/test';

test('element should not change state', async ({ page }) => {
  // 1. Locate the target element
  const element = page.locator('#my-element');

  // 2. Get its initial state (e.g., text content)
  //    Use .first() to ensure we get a single element's state
  const initialState = await element.first().textContent();

  // 3. Define an async function that returns the current state
  const getCurrentState = async () => {
    return await element.first().textContent();
  };

  // 4. Use expect.poll to assert that for the next 5 seconds,
  //    the state remains exactly the same as the initial state.
  //    If it changes even once during this period, the test fails.
  await expect.poll(getCurrentState, {
    // Polling intervals (optional, defaults are usually fine)
    intervals: [100, 250, 500, 1000],
    // How long to keep polling to confirm "it's been a while"
    timeout: 5000, 
    // Optional custom error message
    message: 'Element state changed unexpectedly!',
  }).toEqual(initialState);
});
```

**Why this is great**:
- It perfectly embodies the idea of "waiting a while to confirm nothing changed".
- `timeout` defines exactly how long "a while" is.
- It works for any serializable state (text, innerHTML, attribute values, computed styles, etc.).

---

### Method 2: Using `page.waitForFunction()` for Custom Logic

If you need more granular control over the polling logic (e.g., checking multiple elements or complex conditions), use `page.waitForFunction()`. It executes a script in the browser context until it returns `true`.

```javascript
import { test, expect } from '@playwright/test';

test('element should be stable', async ({ page }) => {
  const element = page.locator('#my-element');
  
  // 1. Capture the initial state
  const initialText = await element.textContent();

  // 2. Wait for a condition: within the timeout, the element's text
  //    must always equal the initial text.
  await page.waitForFunction(
    // This function runs inside the browser
    ({ selector, expectedText }) => {
      const el = document.querySelector(selector);
      // If the element disappears, treat it as a state change (failure)
      if (!el) return false;
      return el.textContent === expectedText;
    },
    // Arguments to pass to the browser function
    { selector: '#my-element', expectedText: initialText },
    // Options: timeout defines how long to monitor
    { timeout: 5000 }
  );

  // If waitForFunction resolves successfully, the state remained unchanged.
  // Add an explicit assertion for a clean test report.
  await expect(element).toHaveText(initialText);
});
```

---

### Critical Best Practices

1.  **Never use `setTimeout` or `page.waitForTimeout()` for this**: Hard-coded waits are flaky and slow. They don't actually *check* anything. Always use conditional waits (`expect.poll` or `waitForFunction`) that stop immediately once the condition is met (or wait the full duration to confirm no change).

2.  **Choosing the right `timeout`**: This value is your definition of "a while". If an action usually takes 1 second but should never exceed 5 seconds, set `timeout: 5000`. This ensures your test is fast in success cases (it will still wait the full 5 seconds to confirm stability!) and fails promptly if a change occurs earlier.

3.  **State representation**: Be careful what you capture as the "state".
    - `textContent` is great for simple text.
    - Use `getAttribute('class')` for class changes.
    - Use `inputValue()` for form inputs.
    - If you need to check invisible UI state, consider checking a data attribute (e.g., `data-testid="loading-finished"`).

4.  **Cross-browser and headless/UI consistency**: Both `expect.poll` and `page.waitForFunction` are implemented at the Playwright driver level, not the rendering engine level. They rely on the CDP (Chrome DevTools Protocol) or its Firefox/WebKit equivalents to evaluate JavaScript, which means their behavior is **100% deterministic** across all browsers and headless modes.

---

### Summary Table

| Method | Core Mechanism | Best Use Case |
| :--- | :--- | :--- |
| **`expect.poll()`** | Polls an async function and uses Jest-style matchers (`toEqual`, `toBe`, etc.) to check the return value. | **Highly recommended**. Cleanest syntax, fully integrated with Playwright Test's built-in retry logic and error reporting. |
| **`page.waitForFunction()`** | Executes a custom JS function in the browser page and waits for it to return `true`. | Needed when your stability check involves complex logic, multiple elements, or conditions that are hard to serialize just via `textContent`. |

Both approaches require zero extra configuration and work flawlessly across all three major browsers in any execution mode. Choose the one that feels most readable for your specific test case! Let me know if you need a specific example for checking attributes or input values instead of text.