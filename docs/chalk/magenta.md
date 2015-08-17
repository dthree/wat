## chalk.magenta\[.style\](string[, string...])

Colors a string magenta.

```js
chalk.magenta('Hello Sindre');
chalk.magenta.underline.bold('Hello Sindre');

let name = 'Sindre';
chalk.magenta('Hello %s', name);
// Hello Sindre
```