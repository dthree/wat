## Chalk

A string styling module for Node.js. Chalk is a clean and focused alternative to color.js, which had serious deficiencies like extending `String.prototype` which caused all kinds of problems.

*Chalk is a clean and focused alternative.*

```bash
npm install --save chalk
```

```js
var chalk = require('chalk');
chalk.blue('Hello world!');
chalk.blue('Hello') + 'World' + chalk.red('!');
chalk.blue.bgRed.bold('Hello world!');
chalk.blue('Hello', 'World!', 'Foo', 'bar', 'biz', 'baz');
chalk.red('Hello', chalk.underline.bgBlue('world') + '!');
chalk.green(
    'I am a green line ' +
    chalk.blue.underline.bold('with a blue substring') +
    ' that becomes green again!'
);
```