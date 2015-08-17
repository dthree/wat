## chalk.blue\[.style\](string[, string...])

Colors a string blue.
*On Windows the bright version is used as normal blue is illegible.*

```js
chalk.blue('Hello Sindre');
chalk.blue.underline.bold('Hello Sindre');

let name = 'Sindre';
chalk.blue('Hello %s', name);
// Hello Sindre
```