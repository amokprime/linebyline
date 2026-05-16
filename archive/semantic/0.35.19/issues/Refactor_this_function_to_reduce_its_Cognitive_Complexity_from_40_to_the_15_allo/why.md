This rule raises an issue when the code cognitive complexity of a function is above a certain threshold.

Cognitive Complexity is a measure of how hard it is to understand the control flow of a unit of code. Code with high cognitive complexity is hard to read, understand, test, and modify.

As a rule of thumb, high cognitive complexity is a sign that the code should be refactored into smaller, easier-to-manage pieces.

### Which syntax in code does impact cognitive complexity score?

Here are the core concepts:

  * **Cognitive complexity is incremented each time the code breaks the normal linear reading flow.**  
This concerns, for example, loop structures, conditionals, catches, switches, jumps to labels, and conditions mixing multiple operators. 
  * **Each nesting level increases complexity.**  
During code reading, the deeper you go through nested layers, the harder it becomes to keep the context in mind. 
  * **Method calls are free**  
A well-picked method name is a summary of multiple lines of code. A reader can first explore a high-level view of what the code is performing then go deeper and deeper by looking at called functions content.  
_Note:_ This does not apply to recursive calls, those will increment cognitive score. 



The method of computation is fully detailed in the pdf linked in the resources.

Note that the calculation of cognitive complexity at function level deviates from the documented process. Given the functional nature of JavaScript, nesting functions is a prevalent practice, especially within frameworks like React.js. Consequently, the cognitive complexity of functions remains independent from one another. This means that the complexity of a nesting function does not increase with the complexity of nested functions.

### What is the potential impact?

Developers spend more time reading and understanding code than writing it. High cognitive complexity slows down changes and increases the cost of maintenance.

### Exceptions

Cognitive complexity calculations exclude logical expressions using the `||` and `??` operators.
    
    
    function greet(name) {
        name = name || 'Guest';
        console.log('Hello, ' + name + '!');
    }