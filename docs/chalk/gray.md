## chalk.gray\[.style\](string[, string...])

Colors a string gray.

```js
chalk.gray('Hello Sindre');
chalk.gray.underline.bold('Hello Sindre');

let name = 'Sindre';
chalk.gray('Hello %s', name);
// Hello Sindre
```