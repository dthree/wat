## chalk.white\[.style\](string[, string...])

Colors a string white.

```js
chalk.white('Hello Sindre');
chalk.white.underline.bold('Hello Sindre');

let name = 'Sindre';
chalk.white('Hello %s', name);
// Hello Sindre
```