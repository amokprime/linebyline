Reducing cognitive complexity can be challenging.  
Here are a few suggestions:

  * **Extract complex conditions in a new function.**  
Mixed operators in condition will increase complexity. Extracting the condition in a new function with an appropriate name will reduce cognitive load. 
  * **Break down large functions.**  
Large functions can be hard to understand and maintain. If a function is doing too many things, consider breaking it down into smaller, more manageable functions. Each function should have a single responsibility. 
  * **Avoid deep nesting by returning early.**  
To avoid the nesting of conditions, process exceptional cases first and return early. 
  * **Use null-safe operations (if available in the language).**  
When available the `.?` or `??` operator replaces multiple tests and simplifies the flow. 



**Extraction of a complex condition in a new function.**

#### Noncompliant code example

The code is using a complex condition and has a cognitive cost of 3.
    
    
    function calculateFinalPrice(user, cart) {
      let total = calculateTotal(cart);
      if (user.hasMembership                       // +1 (if)
        && user.orders > 10                        // +1 (more than one condition)
        && user.accountActive
        && !user.hasDiscount
        || user.orders === 1) {                    // +1 (change of operator in condition)
          total = applyDiscount(user, total);
      }
      return total;
    }
    

#### Compliant solution

Even if the cognitive complexity of the whole program did not change, it is easier for a reader to understand the code of the `calculateFinalPrice` function, which now only has a cognitive cost of 1.
    
    
    function calculateFinalPrice(user, cart) {
      let total = calculateTotal(cart);
      if (isEligibleForDiscount(user)) {       // +1 (if)
        total = applyDiscount(user, total);
      }
      return total;
    }
    
    function isEligibleForDiscount(user) {
      return user.hasMembership
        && user.orders > 10                     // +1 (more than one condition)
        && user.accountActive
        && !user.hasDiscount
        || user.orders === 1                    // +1 (change of operator in condition)
    }
    

**Break down large functions.**

#### Noncompliant code example

For example, consider a function that calculates the total price of a shopping cart, including sales tax and shipping.  
_Note:_ The code is simplified here, to illustrate the purpose. Please imagine there is more happening in the `for` loops.
    
    
    function calculateTotal(cart) {
      let total = 0;
      for (let i = 0; i < cart.length; i++) {       // +1 (for)
        total += cart[i].price;
      }
    
      // calculateSalesTax
      for (let i = 0; i < cart.length; i++) {       // +1 (for)
        total += 0.2 * cart[i].price;
      }
    
      //calculateShipping
      total += 5 * cart.length;
    
      return total;
    }
    

This function could be refactored into smaller functions: The complexity is spread over multiple functions and the complex `calculateTotal` has now a complexity score of zero.

#### Compliant solution
    
    
    function calculateTotal(cart) {
      let total = calculateSubtotal(cart);
      total += calculateSalesTax(cart);
      total += calculateShipping(cart);
      return total;
    }
    
    function calculateSubtotal(cart) {
      let subTotal = 0;
      for (const item of cart) {        // +1 (for)
        subTotal += item.price;
      }
      return subTotal;
    }
    
    function calculateSalesTax(cart) {
      let salesTax = 0;
      for (const item of cart) {        // +1 (for)
        salesTax += 0.2 * item.price;
      }
      return salesTax;
    }
    
    function calculateShipping(cart) {
      return 5 * cart.length;
    }
    

**Avoid deep nesting by returning early.**

#### Noncompliant code example

The below code has a cognitive complexity of 6.
    
    
    function calculateDiscount(price, user) {
      if (isEligibleForDiscount(user)) {  // +1 ( if )
        if (user?.hasMembership) {        // +2 ( nested if )
          return price * 0.9;
      } else if (user?.orders === 1 ) {   // +1 ( else )
              return price * 0.95;
        } else {                          // +1 ( else )
          return price;
        }
      } else {                            // +1 ( else )
        return price;
      }
    }
    

#### Compliant solution

Checking for the edge case first flattens the `if` statements and reduces the cognitive complexity to 3.
    
    
    function calculateDiscount(price, user) {
        if (!isEligibleForDiscount(user)) {  // +1 ( if )
          return price;
        }
        if (user?.hasMembership) {           // +1 ( if )
          return price * 0.9;
        }
        if (user?.orders === 1) {            // +1 ( if )
          return price * 0.95;
        }
        return price;
    }
    

**Use the optional chaining operator to access data.**

In the below code, the cognitive complexity is increased due to the multiple checks required to access the manufacturer's name. This can be simplified using the optional chaining operator.

#### Noncompliant code example
    
    
    let manufacturerName = null;
    
    if (product && product.details && product.details.manufacturer) { // +1 (if) +1 (multiple condition)
        manufacturerName = product.details.manufacturer.name;
    }
    if (manufacturerName) { // +1 (if)
      console.log(manufacturerName);
    } else {
      console.log('Manufacturer name not found');
    }
    

#### Compliant solution

The optional chaining operator will return `undefined` if any reference in the chain is `undefined` or `null`, avoiding multiple checks:
    
    
    let manufacturerName = product?.details?.manufacturer?.name;
    
    if (manufacturerName) { // +1 (if)
      console.log(manufacturerName);
    } else {
      console.log('Manufacturer name not found');
    }
    

### Pitfalls

As this code is complex, ensure that you have unit tests that cover the code before refactoring.