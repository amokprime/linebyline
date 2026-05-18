Ensure the visible text is contained within the accessible name by updating the aria-label to include the visible text.

#### Noncompliant code example
    
    
    <button aria-label="Send">Submit Order</button> <!-- Noncompliant -->
    

#### Compliant solution
    
    
    <button aria-label="Submit Order">Submit Order</button>