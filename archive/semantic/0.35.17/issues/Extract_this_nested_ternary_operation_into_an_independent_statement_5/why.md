Nested ternaries are hard to read and can make the order of operations complex to understand.
    
    
    function getReadableStatus(job) {
      return job.isRunning() ? "Running" : job.hasErrors() ? "Failed" : "Succeeded ";  // Noncompliant
    }
    

Instead, use another line to express the nested operation in a separate statement.
    
    
    function getReadableStatus(job) {
      if (job.isRunning()) {
        return "Running";
      }
      return job.hasErrors() ? "Failed" : "Succeeded";
    }
    

### Exceptions

This rule does not apply in JSX expressions to support conditional rendering and conditional attributes as long as the nesting happens in separate JSX expression containers, i.e. JSX elements embedding JavaScript code, as shown below:
    
    
    return (
    <>
      {isLoading ? (
        <Loader active />
      ) : (
        <Panel label={isEditing ? 'Open' : 'Not open'}>
          <a>{isEditing ? 'Close now' : 'Start now'}</a>
          <Checkbox onClick={!saving ? setSaving(saving => !saving) : null} />
        </Panel>
      )}
    </>
    );
    

If you have nested ternaries in the same JSX expression container, refactor your logic into a separate function like that:
    
    
    function myComponent(condition) {
      if (condition < 0) {
        return '<DownSign>it is negative</DownSign>';
      } else if (condition > 0) {
        return '<UpSign>it is positive</UpSign>';
      } else {
        return '<BarSign>it is zero</BarSign>';
      }
    }
    
    return (
      {myComponent(foo)}
    );