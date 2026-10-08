---
model: Sonnet 4.6
---
What do you check for during the "check" step of project instructions? Do you perform 'unit tests'?

---
The "check" step as defined in your project instructions is specifically:

> Syntax validation: `new Function(scriptContent)` on extracted script block before every delivery

So it's a **syntax check only** — it catches malformed JavaScript (unclosed brackets, bad syntax, etc.) but nothing more. No unit tests, no runtime behaviour checks, no functional validation.

The practical limitation is significant: `new Function(scriptContent)` parses the script as a function body, which catches parse errors but won't catch things like:

- A patched function that references a variable that no longer exists
- Logic errors introduced by a refactor
- A helper extraction that accidentally broke a closure dependency
- Wrong line numbers in the SECTIONS index

Those are caught (or not) by you testing the app in the browser after delivery. The instructions compensate for the lack of runtime testing by requiring staged delivery (one category of change per turn), targeted `grep` spot-checks to verify specific changes landed correctly, and the general principle of preferring confident targeted fixes over speculative changes.

So: syntax check yes, unit tests no.