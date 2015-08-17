## chalk.bgCyan[.style](string[, string...])

Applies a cyan background color to a string.

```js
chalk.bgCyan('Hello Sindre');
chalk.bgCyan.underline.bold('Hello Sindre');

let name = 'Sindre';
chalk.bgCyan('Hello %s', name);
// Hello Sindre
```