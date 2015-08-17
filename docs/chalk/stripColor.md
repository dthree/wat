## chalk.stripColor(string)

Strip color from a string.

Can be useful in combination with `.supportsColor` to strip color on externally styled text when it's not supported.

```js
const chalk = require('chalk');
let styledString = getText();
 
if (!chalk.supportsColor) {
  styledString = chalk.stripColor(styledString);
}
```