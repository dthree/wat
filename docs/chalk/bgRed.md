## chalk.bgRed[.style](string[, string...])

Applies a red background color to a string.

```js
chalk.bgRed('Hello Sindre');
chalk.bgRed.underline.bold('Hello Sindre');

let name = 'Sindre';
chalk.bgRed('Hello %s', name);
// Hello Sindre
```