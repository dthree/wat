## chalk.underline\[.style\](string[, string...])

Applies an underline modifier to a string.

```js
chalk.underline('Hello Sindre');
chalk.green.underline('Hello Sindre');

let name = 'Sindre';
chalk.underline('Hello %s', name);
// Hello Sindre
```