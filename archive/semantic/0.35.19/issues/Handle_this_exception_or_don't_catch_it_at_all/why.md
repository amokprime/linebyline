When exceptions occur, it is usually a bad idea to simply ignore them. Instead, it is better to handle them properly, or at least to log them.

### Noncompliant code example
    
    
    function f() {
      try {
        doSomething();
      } catch (err) {
      }
    }
    

### Compliant solution
    
    
    function f() {
      try {
        doSomething();
      } catch (err) {
        console.log(`Exception while doing something: ${err}`);
      }
    }