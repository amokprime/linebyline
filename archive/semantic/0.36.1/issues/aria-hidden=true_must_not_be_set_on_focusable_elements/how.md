Check if the element is focusable. Focusable elements should not have `aria-hidden` attribute.

#### Noncompliant code example
    
    
    <button aria-hidden="true">Click me</button>
    

Remove `aria-hidden` attribute.

#### Compliant solution
    
    
    <button>Click me</button>