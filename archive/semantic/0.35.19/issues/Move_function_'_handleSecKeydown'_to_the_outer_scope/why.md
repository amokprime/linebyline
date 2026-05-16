This is an issue when a function is defined in a nested scope but doesn't use any variables from that scope, meaning it could be moved to a higher scope.

When functions are defined in nested scopes unnecessarily, it creates several problems:

**Performance Impact** : Functions defined inside other functions are recreated every time the outer function runs. This wastes memory and processing time, especially in frequently called code.

**Engine Optimization** : JavaScript engines like V8 have optimization limits. Functions in nested scopes are harder to optimize, which can slow down your application.

**Code Readability** : Functions at higher scopes are easier to find and understand. When a function doesn't depend on its surrounding context, placing it at the top level makes the code structure clearer.

**Memory Usage** : Each function instance takes up memory. Creating the same function repeatedly in nested scopes increases memory consumption unnecessarily.

The rule identifies functions that capture no variables from their enclosing scope, meaning they can be safely moved to a higher level without changing their behavior.

### What is the potential impact?

Moving functions to appropriate scopes improves application performance by reducing function recreation overhead and enabling better JavaScript engine optimizations. It also enhances code maintainability by making function dependencies clearer and reducing memory usage in frequently executed code paths.

### How to fix?

Move the function declaration to the module level when it doesn't capture any variables from the enclosing scope.

#### Non-compliant code example
    
    
    export function doFoo(foo) {
    	// Does not capture anything from the scope
    	function doBar(bar) { // Noncompliant
    		return bar === 'bar';
    	}
    
    	return doBar;
    }
    

#### Compliant code example
    
    
    function doBar(bar) {
    	return bar === 'bar';
    }
    
    export function doFoo(foo) {
    	return doBar;
    }
    

### Documentation

  * [eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn#readme) \- Rule [consistent-function-scoping](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/HEAD/docs/rules/consistent-function-scoping.md)
  * JavaScript Function Hoisting - [MDN documentation on JavaScript hoisting behavior](https://developer.mozilla.org/en-US/docs/Glossary/Hoisting)



### Standards

  * ESLint: prefer-const - [Related ESLint rule for variable declaration optimization](https://eslint.org/docs/latest/rules/prefer-const)