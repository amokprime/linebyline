Loop counters, such as variables used to track the iteration count in loops, should not be assigned from within the loop body to avoid unexpected behavior and bugs. It can inadvertently lead to an infinite loop or make the loop behavior more complex and harder to reason about.
    
    
    const names = [ "Jack", "Jim", "", "John" ];
    for (let i = 0; i < names.length; i++) {
      if (!names[i]) {
        i = names.length; // Noncompliant: The loop counter i is assigned within the loop body
      } else {
        console.log(names[i]);
      }
    }
    

To avoid these issues, you should update the loop counter only in the loop's update statement, typically located at the end of the loop body or within the loop header.
    
    
    const names = [ "Jack", "Jim", "", "John" ];
    for (let i = 0; i < names.length; i++) {
      if (!names[i]) {
        break;
      } else {
        console.log(names[i]);
      }
    }
    

Alternatively, you should use the `for…​of` statement if your intention is only to iterate over the values of an iterable object.
    
    
    const names = [ "Jack", "Jim", "", "John" ];
    for (const name of names) {
      if (!name) {
        break;
      } else {
        console.log(name);
      }
    }
    

## Exceptions

The rule allows intentional skip-ahead patterns commonly found in parsing code, where the loop counter is deliberately advanced to skip over already-processed elements:

  * Update expressions: `i`, `i`, `--i`, `i--`
  * Compound assignment operators: `i += n`, `i -= n`, and other compound assignments 



These patterns are legitimate when processing sequences where elements need to be consumed in batches or skipped dynamically, such as:

  * Skipping escape characters in string processing 
  * Consuming multi-element tuples from flat arrays 
  * Processing Unicode surrogate pairs 
  * Batch processing of streamed data 


    
    
    function parseEscapedString(value, escapeChar) {
      for (let i = 0; i < value.length; i++) {
        const ch = value[i];
        if (ch === escapeChar) {
          i++; // Compliant: skip-ahead after escape character
          // Process escaped character
        }
      }
    }
    
    function processOpcodes(opcodes) {
      for (let i = 0; i < opcodes.length; i++) {
        const opcode = opcodes[i];
        if (opcode > 0) {
          const param1 = opcodes[++i]; // Compliant: consume next element
          const param2 = opcodes[++i]; // Compliant: consume next element
          console.log('complex:', opcode, param1, param2);
        }
      }
    }
    

Simple assignments (`i = value`) are still flagged as they typically indicate early-exit patterns that should use `break` instead, unless used to compensate for index shifts caused by `splice()`.

When iterating over an array and removing elements with `splice()`, it is common to adjust the loop counter to compensate for the index shift caused by the removal. This pattern is intentional and will not be flagged.
    
    
    const items = [1, 2, 3, 4, 5];
    for (let i = 0; i < items.length; i++) {
      if (items[i] % 2 === 0) {
        items.splice(i, 1);
        i = i - 1; // Compliant: compensating for splice index shift
      }
    }