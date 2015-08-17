## chalk.italic\[.style\](string[, string...])

Applies an italic modifier to a string *(not widely supported)*.

```js
chalk.italic('Hello Sindre');
chalk.green.underline.italic('Hello Sindre');

let name = 'Sindre';
chalk.italic('Hello %s', name);
// Hello Sindre
```