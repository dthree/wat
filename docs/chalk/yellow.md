## chalk.yellow\[.style\](string[, string...])

Colors a string yellow.

```js
chalk.yellow('Hello Sindre');
chalk.yellow.underline.bold('Hello Sindre');

let name = 'Sindre';
chalk.yellow('Hello %s', name);
// Hello Sindre
```