## chalk.red\[.style\](string[, string...])

Colors a string red.

```js
chalk.red('Hello Sindre');
chalk.red.underline.bold('Hello Sindre');

let name = 'Sindre';
chalk.red('Hello %s', name);
// Hello Sindre
```