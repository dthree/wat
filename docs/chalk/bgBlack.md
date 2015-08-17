## chalk.bgBlack\[.style\](string[, string...])

Applies a black background color to a string.

```js
chalk.bgBlack('Hello Sindre');
chalk.bgBlack.underline.bold('Hello Sindre');

let name = 'Sindre';
chalk.bgBlack('Hello %s', name);
// Hello Sindre
```