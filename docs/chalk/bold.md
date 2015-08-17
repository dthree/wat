## chalk.bold[.style](string[, string...])

Applies a bold modifier to a string.

```js
chalk.bold('Hello Sindre');
chalk.green.underline.bold('Hello Sindre');

let name = 'Sindre';
chalk.bold('Hello %s', name);
// Hello Sindre
```