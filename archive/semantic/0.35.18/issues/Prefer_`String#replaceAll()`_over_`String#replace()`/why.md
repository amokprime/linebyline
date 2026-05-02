This rule flags when `String#replace()` is used with a global regex pattern, or when `String#replaceAll()` is used with a global regex flag.

The `String#replaceAll()` method was introduced in ES2021 to provide a clearer and safer way to replace all occurrences of a pattern in a string.

When using `String#replace()` with a global regex, developers must remember to include the global flag (`g`) and properly escape special regex characters if the search pattern contains them. This can lead to bugs when special characters are not escaped correctly.

For example, if you want to replace all dots in a string, using `string.replace(/./g, '')` will actually replace all characters (since `.` matches any character in regex), not just literal dots. You would need `string.replace(/\./g, '')` instead.

With `String#replaceAll()`, you can simply use `string.replaceAll('.', '')` which is both safer and more readable. The method name clearly indicates that all occurrences will be replaced.

When `String#replaceAll()` is used with a regex, the global flag is required, or a `TypeError` will be thrown.

### What is the potential impact?

Using the wrong replacement method can lead to unexpected behavior:

  * Incorrect replacements when special regex characters are not properly escaped 
  * Performance issues due to unnecessary regex compilation 
  * Reduced code readability and maintainability 
  * Potential security vulnerabilities if user input is used in regex patterns without proper escaping 



### How to fix?

Replace `String#replace()` with global regex with `String#replaceAll()` using a string literal when the pattern doesn't need regex features.

#### Non-compliant code example
    
    
    const result = text.replace(/hello/g, 'hi'); // Noncompliant
    

#### Compliant code example
    
    
    const result = text.replaceAll('hello', 'hi');
    

### Documentation

  * [eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn#readme) \- Rule [prefer-string-replace-all](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/HEAD/docs/rules/prefer-string-replace-all.md)
  * MDN: String.prototype.replaceAll() - [Official documentation for the String.replaceAll() method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replaceAll)
  * MDN: String.prototype.replace() - [Official documentation for the String.replace() method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace)