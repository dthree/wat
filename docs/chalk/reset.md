## chalk.reset\[.style\](string[, string...])

Resets any Chalk styles applied to a string.

```js
chalk.bold.blue.reset('Hello Sindre');          // returns plain string.

let name = 'Sindre';
chalk.reset('Hello %s', name);
// Hello Sindre
```