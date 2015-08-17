## chalk.bgWhite\[.style\](string[, string...])

Applies a white background color to a string.

```js
chalk.bgWhite('Hello Sindre');
chalk.bgWhite.underline.bold('Hello Sindre');

let name = 'Sindre';
chalk.bgWhite('Hello %s', name);
// Hello Sindre
```