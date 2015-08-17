## chalk.bgBlue[.style](string[, string...])

Applies a blue background color to a string.

```js
chalk.bgBlue('Hello Sindre');
chalk.bgBlue.underline.bold('Hello Sindre');

let name = 'Sindre';
chalk.bgBlue('Hello %s', name);
// Hello Sindre
```