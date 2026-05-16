This rule raises an issue when `parentNode.removeChild(childNode)` is used instead of the more direct `childNode.remove()` method.

The traditional way to remove a DOM element in JavaScript was to call `parentNode.removeChild(childNode)`. This approach requires you to first access the parent node, then call `removeChild` with the child node as an argument.

Modern browsers support the `remove()` method directly on DOM nodes, which provides a cleaner and more intuitive API. Using `childNode.remove()` is simpler because:

  * It requires less code and fewer method calls 
  * It's more readable and expresses the intent more clearly 
  * It eliminates the need to access the parent node 
  * It follows modern JavaScript patterns 



The `remove()` method has been widely supported across browsers for many years and is the recommended approach for removing DOM elements.

### What is the potential impact?

Using the older `removeChild` pattern makes code more verbose and harder to read. While functionally equivalent, the modern `remove()` method improves code maintainability and follows current best practices for DOM manipulation.

### How to fix?

Replace `parentNode.removeChild(childNode)` with `childNode.remove()`. This directly removes the element without needing to access its parent.

#### Non-compliant code example
    
    
    parentNode.removeChild(foo); // Noncompliant
    parentNode.removeChild(this); // Noncompliant
    

#### Compliant code example
    
    
    foo.remove();
    this.remove();
    

### Documentation

  * [eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn#readme) \- Rule [prefer-dom-node-remove](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/HEAD/docs/rules/prefer-dom-node-remove.md)
  * MDN: ChildNode.remove() - [Documentation for the modern remove() method](https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/remove)
  * MDN: Node.removeChild() - [Documentation for the legacy removeChild() method](https://developer.mozilla.org/en-US/docs/Web/API/Node/removeChild)