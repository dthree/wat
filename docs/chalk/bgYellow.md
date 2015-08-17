## chalk.bgYellow\[.style\](string[, string...])

Applies a yellow background color to a string.

```js
chalk.bgYellow('Hello Sindre');
chalk.bgYellow.underline.bold('Hello Sindre');

let name = 'Sindre';
chalk.bgYellow('Hello %s', name);
// Hello Sindre
```