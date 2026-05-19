This is an issue when an interactive element has visible text that is not contained within its accessible name, creating inconsistency between what users see and what assistive technologies announce.

When the visible text of an interactive element differs from its accessible name, it creates confusion and barriers for users with disabilities.

Users of assistive technologies like screen readers rely on the accessible name to understand what an element does. The accessible name is computed from various sources including `aria-label`, `aria-labelledby`, or associated `label` elements.

If the visible text says "Submit Order" but the accessible name is "Send", screen reader users will hear "Send" while sighted users see "Submit Order". This mismatch is particularly problematic for users of voice control software, who might say "click Submit Order" but the software won’t recognize the command because it only knows the element as "Send".

This inconsistency violates the principle that all users should have equivalent access to information and functionality, regardless of how they interact with the interface.

### What is the potential impact?

Users with disabilities may be unable to interact with elements effectively, leading to:

  * Voice control users cannot activate elements because the visible text doesn’t match the accessible name
  * Screen reader users become confused when the announced name differs from the visible text
  * Reduced usability and accessibility compliance, potentially excluding users from completing important tasks
  * Legal and regulatory compliance issues under accessibility laws like ADA and Section 508