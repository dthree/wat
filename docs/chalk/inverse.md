## chalk.inverse\[.style\](string[, string...])

Inverts the default foreground and background colors of a string.

```js
chalk.inverse('Hello Sindre');

let name = 'Sindre';
chalk.inverse('Hello %s', name);
// Hello Sindre
```