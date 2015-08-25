## .use(extension)

Imports a Vorpal extension. Expects a Node module extension (exposed as a function). You can also pass in the string of the module as an alternative, and `vorpal` will `require` it for you.

```js
var system = require('vorpal-system');
vorpal.use(system);
```

```js
// Does the same thing as above.
vorpal.use('vorpal-system');
```
