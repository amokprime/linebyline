`for...of` statements are used to iterate over the values of an iterable object. [Iterables](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol) are objects implementing the `@@iterator` method, which returns an object conforming to the [iterator protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterator_protocol). JavaScript provides many [built-in iterables](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#built-in_iterables) that can and should be used with this looping statement.

The use of the `for...of` statement is recommended over the `for` statement when iterating through iterable objects as simplifies the syntax and eliminates the need for a counter variable.
    
    
    const arr = [4, 3, 2, 1];
    
    for (let i = 0; i < arr.length; i++) {  // Noncompliant: arr is an iterable object
      console.log(arr[i]);
    }
    

When looping over an iterable, use the `for...of` for better readability.
    
    
    const arr = [4, 3, 2, 1];
    
    for (let value of arr) {
      console.log(value);
    }