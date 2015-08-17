## chalk.enabled

Color support is automatically detected, but you can override it by setting the enabled property. You should however only do this in your own code as it applies globally to all chalk consumers.

If you need to change this in a reusable module create a new instance:

```js
var ctx = new chalk.constructor({enabled: false});
```