ARIA (Accessible Rich Internet Applications) is a set of attributes that define ways to make web content and web applications more accessible to people with disabilities. The `aria-hidden` attribute is used to indicate that an element and all of its descendants are not visible or perceivable to any user as implemented by assistive technologies.

However, when `aria-hidden` is used on a focusable element, it can create a confusing and inaccessible experience for screen reader users. This is because the element will still be included in the tab order, so a screen reader user can navigate to it, but it will not be announced by the screen reader due to the `aria-hidden` attribute.

This rule ensures that focusable elements are not hidden from screen readers using the `aria-hidden` attribute.