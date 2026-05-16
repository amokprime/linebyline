This is an issue when a function only calls a built-in type conversion function (`String`, `Number`, `BigInt`, `Boolean`, or `Symbol`) without adding any additional logic.

Creating wrapper functions around built-in type conversion functions is unnecessary and adds complexity without benefit.

JavaScript's built-in functions like `String()`, `Number()`, `Boolean()`, `BigInt()`, and `Symbol()` can be used directly as callbacks or assigned to variables. When you wrap these functions in arrow functions or function declarations that only pass through arguments, you create:

  * **Unnecessary function call overhead** : Each wrapper adds an extra function call in the execution stack 
  * **Reduced readability** : The wrapper obscures the intent and makes the code longer 
  * **Maintenance burden** : More code to maintain without functional benefit 



The built-in functions are designed to work directly in contexts where callbacks are expected, such as with array methods like `map()`, `filter()`, or `some()`.

### What is the potential impact?

This issue impacts code maintainability and performance. The unnecessary wrapper functions create additional function calls that could be avoided, and they make the codebase more verbose without providing any functional benefit. While the performance impact is typically minimal, the readability and maintainability improvements from using built-in functions directly are significant.

### How to fix?

Replace wrapper functions with direct references to built-in type conversion functions. Instead of creating a function that only calls the built-in, use the built-in function directly.

#### Non-compliant code example
    
    
    const toBoolean = value => Boolean(value); // Noncompliant
    const numbers = strings.map(str => Number(str)); // Noncompliant
    
    function toString(value) { // Noncompliant
      return String(value);
    }
    

#### Compliant code example
    
    
    const toBoolean = Boolean;
    const numbers = strings.map(Number);
    
    const toString = String;
    

### Documentation

  * [eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn#readme) \- Rule [prefer-native-coercion-functions](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/HEAD/docs/rules/prefer-native-coercion-functions.md)
  * MDN - String - [Documentation for JavaScript's built-in String function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  * MDN - Number - [Documentation for JavaScript's built-in Number function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  * MDN - Boolean - [Documentation for JavaScript's built-in Boolean function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)
  * MDN - BigInt - [Documentation for JavaScript's built-in BigInt function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)
  * MDN - Symbol - [Documentation for JavaScript's built-in Symbol function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol)