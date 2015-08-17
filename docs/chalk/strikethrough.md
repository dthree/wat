## chalk.strikethrough[.style](string[, string...])

Applies a strikethrough modifier to a string *(not widely supported)*.

```js
chalk.strikethrough('Hello Sindre');
chalk.green.underline.strikethrough('Hello Sindre');

let name = 'Sindre';
chalk.strikethrough('Hello %s', name);
// Hello Sindre
```