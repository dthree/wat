## chalk.bgMagenta[.style](string[, string...])

Applies a magenta background color to a string.

```js
chalk.bgMagenta('Hello Sindre');
chalk.bgMagenta.underline.bold('Hello Sindre');

let name = 'Sindre';
chalk.bgMagenta('Hello %s', name);
// Hello Sindre
```