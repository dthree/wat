## chalk.dim\[.style\](string[, string...])

Applies a dim modifier to a string.

```js
chalk.dim('Hello Sindre');
chalk.green.underline.dim('Hello Sindre');

let name = 'Sindre';
chalk.dim('Hello %s', name);
// Hello Sindre
```