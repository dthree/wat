## chalk.bgGreen[.style](string[, string...])

Applies a green background color to a string.

```js
chalk.bgGreen('Hello Sindre');
chalk.bgGreen.underline.bold('Hello Sindre');

let name = 'Sindre';
chalk.bgGreen('Hello %s', name);
// Hello Sindre
```