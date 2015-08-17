## chalk.black\[.style\](string[, string...])

Colors a string black.

```js
chalk.black('Hello Sindre');
chalk.black.underline.bold('Hello Sindre');

let name = 'Sindre';
chalk.black('Hello %s', name);
// Hello Sindre
```