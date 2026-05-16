An issue is raised when a string literal contains escaped backslashes (`\\`) that could be simplified using `String.raw` template literals.

String literals with escaped backslashes can be difficult to read and maintain. Each backslash character must be escaped with another backslash, creating sequences like `\\` that are hard to interpret at a glance.

This problem is particularly common when working with:

  * File paths on Windows systems 
  * Regular expression patterns 
  * LaTeX or other markup that uses backslashes 
  * Any string content that naturally contains backslash characters 



The `String.raw` template literal provides a cleaner alternative. It treats backslashes literally without requiring escaping, making the code more readable and less error-prone. The intent becomes clearer, and there's less chance of accidentally missing or adding extra backslashes during maintenance.

### What is the potential impact?

Using escaped backslashes instead of `String.raw` reduces code readability and increases the likelihood of errors when maintaining string literals. While this doesn't cause runtime issues, it makes the codebase harder to understand and modify correctly.

### How to fix?

Replace string literals containing escaped backslashes with `String.raw` template literals. The backslashes inside the template literal don't need to be escaped.

#### Non-compliant code example
    
    
    const filePath = "C:\\Users\\Documents\\file.txt"; // Noncompliant
    

#### Compliant code example
    
    
    const filePath = String.raw`C:\Users\Documents\file.txt`;
    

### Documentation

  * [eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn#readme) \- Rule [prefer-string-raw](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/HEAD/docs/rules/prefer-string-raw.md)
  * String.raw - MDN Web Docs - [Official documentation for the String.raw template literal tag](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/raw)
  * Template literals - MDN Web Docs - [Comprehensive guide to template literals in JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)