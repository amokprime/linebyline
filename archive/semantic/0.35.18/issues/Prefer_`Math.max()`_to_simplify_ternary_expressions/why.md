This rule raises an issue when a ternary expression is used to select the minimum or maximum value between two operands, where the same logic can be expressed more clearly using `Math.min()` or `Math.max()`.

Ternary expressions that implement min/max logic can be harder to read and understand at first glance. When you see `height > 50 ? 50 : height`, you need to mentally parse the comparison logic to understand that it's selecting the smaller value.

Using `Math.min(height, 50)` instead makes the intent immediately clear - you're finding the minimum value. This semantic clarity reduces cognitive load and makes the code more self-documenting.

Additionally, `Math.min()` and `Math.max()` functions:

  * Express intent more directly 
  * Are less prone to logical errors (no risk of swapping the wrong values in ternary branches) 
  * Provide consistency across the codebase 
  * Can easily handle more than two values if needed later 



The pattern recognition required to spot min/max logic in ternaries becomes unnecessary when using the appropriate Math functions, leading to more maintainable code.

### What is the potential impact?

This issue primarily affects code readability and maintainability. While it doesn't introduce security vulnerabilities or runtime errors, it can slow down development and code review processes as developers need extra time to understand the intent of ternary-based min/max logic.

### How to fix?

Replace ternary expressions that select minimum values with `Math.min()`. When the ternary returns the smaller of two values, use `Math.min()` instead.

#### Non-compliant code example
    
    
    const clampedHeight = height > 50 ? 50 : height; // Noncompliant
    const limitedWidth = width >= 100 ? 100 : width; // Noncompliant
    

#### Compliant code example
    
    
    const clampedHeight = Math.min(height, 50);
    const limitedWidth = Math.min(width, 100);
    

### Documentation

  * [eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn#readme) \- Rule [prefer-math-min-max](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/HEAD/docs/rules/prefer-math-min-max.md)
  * Math.min() - MDN - [Documentation for the Math.min() function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/min)
  * Math.max() - MDN - [Documentation for the Math.max() function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/max)
  * Conditional (ternary) operator - MDN - [Documentation for ternary operators and when to use them appropriately](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_Operator)