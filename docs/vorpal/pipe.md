## .pipe(function)

Captures all session `stdout` piped through Vorpal and passes it through a custom function. The string returned from the function is then logged.

```js
var onStdout = function(stdout) {
  app.writeToLog(stdout);
  return "";
}

vorpal
  .pipe(onStdout);

vorpal.log('Hello');
```
