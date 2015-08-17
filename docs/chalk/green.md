## chalk.green\[.style\](string[, string...])

Colors a string green.

```js
chalk.green('Hello Sindre');
chalk.green.underline.bold('Hello Sindre');

let name = 'Sindre';
chalk.green('Hello %s', name);
// Hello Sindre
```