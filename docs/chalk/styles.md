## chalk.styles

Exposes the styles as ANSI escape codes.

Generally not useful, but you might need just the `.open` or `.close` escape code if you're mixing externally styled strings with your own.

```js
var chalk = require('chalk');
 
console.log(chalk.styles.red);
// {open: '\u001b[31m', close: '\u001b[39m'} 
 
console.log(chalk.styles.red.open + 'Hello' + chalk.styles.red.close);
```