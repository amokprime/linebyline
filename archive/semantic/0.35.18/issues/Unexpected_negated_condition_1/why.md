This rule raises an issue when an if-else statement or ternary operator uses a negated condition that could be inverted to improve readability.

Negated conditions in if-else statements can make code harder to read and understand. When you see `if (!condition)`, your brain has to process the negation, which adds cognitive load.

Positive conditions are generally easier to understand because they describe what **is** true rather than what **is not** true. When you have both an if and else branch, you can usually invert the condition and swap the branches to make the code more readable.

For example, `if (!user.isActive)` requires you to think "if the user is NOT active", while `if (user.isActive)` is more direct: "if the user is active".

This pattern is especially problematic with:

  * Boolean negation using the `!` operator 
  * Inequality comparisons like `!==` and `!=`
  * Complex expressions where the negation makes the logic harder to follow 



The rule only flags cases where there's an else clause because single if statements with negated conditions are sometimes the clearest way to express "do something when this condition is false".

### What is the potential impact?

While this issue doesn't affect functionality, it impacts code maintainability and readability. Code with negated conditions takes longer to understand, especially for developers who are:

  * New to the codebase 
  * Working under pressure 
  * Non-native English speakers 
  * Debugging complex logic 



Improved readability leads to fewer bugs, faster code reviews, and easier maintenance.

### How to fix?

Invert the negated boolean condition and swap the if and else blocks.

#### Non-compliant code example
    
    
    if (!isValid) { // Noncompliant
      handleError();
    } else {
      processData();
    }
    

#### Compliant code example
    
    
    if (isValid) {
      processData();
    } else {
      handleError();
    }
    

### Documentation

  * [eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn#readme) \- Rule [no-negated-condition](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/HEAD/docs/rules/no-negated-condition.md)
  * ESLint no-negated-condition rule - [The original ESLint rule that inspired this implementation](https://eslint.org/docs/latest/rules/no-negated-condition)
  * JavaScript Conditional Statements - [MDN documentation on JavaScript conditional statements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling#conditional_statements)



### Standards

  * Clean Code: Meaningful Names - [Principles for writing readable and maintainable code](https://www.oreilly.com/library/view/clean-code-a/9780136083238/)